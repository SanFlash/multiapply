import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';

const COOKIE = 'multiapply_session';
const MAX_AGE = 60 * 60 * 24 * 30;

export type Session = {
  email: string;
  name?: string;
  authenticated: true;
};

function secret() {
  return process.env.SESSION_SECRET?.trim() || '';
}

function encode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decode(value: string) {
  try {
    return Buffer.from(value, 'base64url').toString('utf8');
  } catch {
    return '';
  }
}

function sign(value: string) {
  return createHmac('sha256', secret()).update(value).digest('base64url');
}

function pack(session: Session) {
  const payload = encode(JSON.stringify(session));
  return payload + '.' + sign(payload);
}

function unpack(value: string): Session | null {
  const dot = value.lastIndexOf('.');
  if (dot <= 0) return null;

  const payload = value.slice(0, dot);
  const signature = value.slice(dot + 1);

  if (!secret() || !signature) return null;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);

  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const parsed = JSON.parse(decode(payload)) as Partial<Session>;

  if (
    parsed.authenticated !== true ||
    typeof parsed.email !== 'string' ||
    !parsed.email
  ) {
    return null;
  }

  return {
    email: parsed.email,
    name: typeof parsed.name === 'string' ? parsed.name : undefined,
    authenticated: true,
  };
}

export async function setSession(session: Session) {
  if (secret().length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters');
  }

  (await cookies()).set(COOKIE, pack(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function getSession(): Promise<Session | null> {
  try {
    const value = (await cookies()).get(COOKIE)?.value;
    if (!value) return null;
    return unpack(value);
  } catch {
    return null;
  }
}

export async function clearSession() {
  try {
    (await cookies()).delete(COOKIE);
  } catch {
    // Ignore cookie cleanup errors.
  }
}
