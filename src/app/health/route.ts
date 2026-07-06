import { NextResponse } from 'next/server';

/**
 * Simple health check endpoint that returns 'ok'
 * This is used for basic availability monitoring.
 */
export async function GET() {
  return new NextResponse('ok', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}
