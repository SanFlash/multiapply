import { NextResponse } from 'next/server';
import { env } from '@/lib/config';
export const runtime = 'nodejs';
export async function GET() {
  try {
    const e = env();
    const response = await fetch('https://api.brevo.com/v3/account', { headers: { accept: 'application/json', 'api-key': e.BREVO_API_KEY }, cache: 'no-store' });
    return NextResponse.json({ ok: response.ok, brevo: response.ok ? 'connected' : 'rejected', status: response.status }, { status: response.ok ? 200 : 502 });
  } catch {
    return NextResponse.json({ ok: false, brevo: 'configuration_error' }, { status: 500 });
  }
}