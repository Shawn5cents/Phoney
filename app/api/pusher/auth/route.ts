import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const socketId = data.socket_id;
    const channel = data.channel_name;
    
    // Generate auth token
    const authResponse = pusherServer.authorizeChannel(socketId, channel);
    
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Pusher auth error:', error);
    return NextResponse.json(
      { error: 'Failed to authenticate Pusher connection' },
      { status: 500 }
    );
  }
}
