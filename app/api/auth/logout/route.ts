import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST() {
  try {
    await clearSession();
  } catch {
    // Logout should remain successful even if the cookie is already gone.
  }
  return NextResponse.json({ ok: true });
}
