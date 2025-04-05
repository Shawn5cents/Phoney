import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { RateLimiter } from 'limiter';

// Create a rate limiter map for each IP
const rateLimiters = new Map<string, RateLimiter>();
const MAX_REQUESTS_PER_MINUTE = 60;

// Configuration for protected routes
const PROTECTED_ROUTES = [
  '/api/audio-stream',
  '/api/incoming-call',
  '/api/end-call',
  '/api/get-twilio-token',
  '/api/no-input',
  '/api/process-speech',
  '/api/set-personality'
];

export const config = {
  matcher: ['/api/:path*'],
  runtime: 'nodejs'
};

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = new URL(request.url);
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown';

  // Initialize rate limiter for this IP if it doesn't exist
  if (!rateLimiters.has(clientIp)) {
    rateLimiters.set(clientIp, new RateLimiter({
      tokensPerInterval: MAX_REQUESTS_PER_MINUTE,
      interval: 'minute'
    }));
  }

  const limiter = rateLimiters.get(clientIp)!;
  const hasTokens = await limiter.tryRemoveTokens(1);

  if (!hasTokens) {
    return new NextResponse('Rate limit exceeded', { status: 429 });
  }

  // Validate Twilio webhook signatures for relevant routes
  if (pathname.startsWith('/api/incoming-call') || pathname.startsWith('/api/end-call')) {
    const twilioSignature = request.headers.get('x-twilio-signature');
    if (!twilioSignature) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    // Note: Actual Twilio signature validation should be done in the route handlers
  }

  // Handle WebSocket upgrade for audio stream
  if (pathname.startsWith('/api/audio-stream')) {
    const upgrade = request.headers.get('upgrade');
    const connection = request.headers.get('connection');
    const callSid = searchParams.get('callSid');

    if (!callSid || !/^CA[a-f0-9]{32}$/.test(callSid)) {
      return new NextResponse('Invalid CallSid', { status: 400 });
    }

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

  // Validate request content type for API routes
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    const contentType = request.headers.get('content-type');
    if (request.method === 'POST' && !contentType?.includes('application/json') && !contentType?.includes('form-data')) {
      return new NextResponse('Invalid content type', { status: 415 });
    }
  }

  // Clean up old rate limiters every hour
  if (Math.random() < 0.001) { // 0.1% chance on each request
    const now = Date.now();
    for (const [ip, limiter] of rateLimiters.entries()) {
      if (now - (limiter as any).lastCheck > 3600000) { // 1 hour
        rateLimiters.delete(ip);
      }
    }
  }

  return NextResponse.next();
}