import { NextResponse } from 'next/server';
import { setSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;
    const sessionSecret = process.env.SESSION_SECRET?.trim();

    if (
      !adminEmail ||
      !adminPassword ||
      adminPassword.length < 8 ||
      !sessionSecret ||
      sessionSecret.length < 32
    ) {
      return NextResponse.json(
        { error: 'Login configuration is incomplete.' },
        { status: 503 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');

    if (email !== adminEmail || password !== adminPassword) {
      return NextResponse.json(
        { error: 'Incorrect email or password.' },
        { status: 401 },
      );
    }

    await setSession({
      email: adminEmail,
      name: process.env.BREVO_SENDER_NAME?.trim() || 'MultiApply',
      authenticated: true,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('MultiApply login error:', error);
    return NextResponse.json(
      { error: 'Login service unavailable.' },
      { status: 500 },
    );
  }
}
