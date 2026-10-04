import { NextResponse } from 'next/server';
import { readSessionToken, SESSION_COOKIE } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(SESSION_COOKIE + '='));

    const token = match
      ? decodeURIComponent(match.slice(SESSION_COOKIE.length + 1))
      : undefined;

    const session = readSessionToken(token);

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 },
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('MultiApply session error:', error);
    return NextResponse.json(
      { error: 'Session unavailable' },
      { status: 401 },
    );
  }
}
