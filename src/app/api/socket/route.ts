import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  // Socket.IO will handle the upgrade to WebSocket
  // This endpoint is just for Socket.IO to attach to
  return new Response('Socket.IO server is running', { 
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
} 