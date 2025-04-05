import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: '/api/audio-stream',
  runtime: 'nodejs'
};

export async function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url);

  // Only handle WebSocket upgrade requests for audio streams
  if (pathname.startsWith('/api/audio-stream')) {
    const upgrade = request.headers.get('upgrade');
    const connection = request.headers.get('connection');

    if (!upgrade || !connection?.includes('upgrade') || upgrade !== 'websocket') {
      return new NextResponse('Expected WebSocket connection', { 
        status: 426,
        headers: {
          'Upgrade': 'websocket',
          'Connection': 'Upgrade'
        }
      });
    }

    // Let the API route handle the WebSocket upgrade
    return NextResponse.next({
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Protocol': request.headers.get('sec-websocket-protocol') || '',
        'Sec-WebSocket-Key': request.headers.get('sec-websocket-key') || '',
        'Sec-WebSocket-Version': request.headers.get('sec-websocket-version') || ''
      }
    });
  }

  return NextResponse.next();
}