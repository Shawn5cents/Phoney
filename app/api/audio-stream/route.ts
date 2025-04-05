import { NextRequest } from 'next/server';
import { audioStreamHandler } from '@/lib/audio-stream';
import { IncomingMessage } from 'http';
import { Socket } from 'net';

type HandlerArgs = {
  params: { callSid?: string };
};

const upgradeRequestToNode = (req: NextRequest): IncomingMessage => {
  const message = new IncomingMessage(new Socket());
  message.url = req.url;
  message.method = req.method;
  message.headers = {};
  req.headers.forEach((value, key) => {
    message.headers[key.toLowerCase()] = value;
  });
  return message;
};

export async function GET(req: NextRequest, { params }: HandlerArgs) {
  try {
    const searchParams = new URL(req.url).searchParams;
    const callSid = searchParams.get('callSid');

    if (!callSid) {
      return new Response('Missing callSid parameter', {
        status: 400
      });
    }

    // Upgrade the connection to WebSocket
    const upgrade = req.headers.get('upgrade');
    const connection = req.headers.get('connection');

    if (!upgrade || !connection?.includes('upgrade') || upgrade !== 'websocket') {
      return new Response('Expected WebSocket upgrade', {
        status: 426,
        headers: {
          'Upgrade': 'websocket'
        }
      });
    }

    // Get socket information from the request
    const socket = (req as any).socket as Socket;
    if (!socket) {
      return new Response('WebSocket upgrade failed', { status: 500 });
    }

    try {
      // Convert Next.js request to Node.js request for WebSocket handling
      const nodeRequest = upgradeRequestToNode(req);
      
      // Pass the connection to our AudioStreamHandler
      audioStreamHandler.handleUpgrade(
        nodeRequest,
        socket,
        Buffer.from(''),
      );

      // Return void to signal that we're handling the upgrade
      return new Response(null);
    } catch (wsError) {
      console.error('WebSocket upgrade failed:', wsError);
      return new Response('WebSocket upgrade failed', { status: 500 });
    }
  } catch (error) {
    console.error('Audio stream handler error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

// WebSocket connections don't use the standard HTTP methods
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';