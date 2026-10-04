import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.BREVO_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      { ok: false, brevo: 'not_configured' },
      { status: 503 },
    );
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/account', {
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
      },
      cache: 'no-store',
    });

    return NextResponse.json(
      {
        ok: response.ok,
        brevo: response.ok ? 'connected' : 'rejected',
        status: response.status,
      },
      { status: response.ok ? 200 : 502 },
    );
  } catch {
    return NextResponse.json(
      { ok: false, brevo: 'unreachable' },
      { status: 503 },
    );
  }
}
