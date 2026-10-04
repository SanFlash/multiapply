import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';

const COOKIE = 'multiapply_session';
const MAX_AGE = 60 * 60 * 24 * 30;

export type Session = {
  email: string;
  name?: string;
  authenticated: true;
};

function getSecret() {
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

function sign(payload: string) {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

function createToken(session: Session) {
  const payload = encode(JSON.stringify(session));
  return payload + '.' + sign(payload);
}

function readToken(token: string): Session | null {
  const separator = token.lastIndexOf('.');
  if (separator <= 0 || !getSecret()) return null;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = sign(payload);

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);

  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
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
  } catch {
    return null;
  }
}

export async function setSession(session: Session) {
  const secret = getSecret();
  if (secret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters');
  }

  (await cookies()).set(COOKIE, createToken(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function getSession() {
  try {
    const token = (await cookies()).get(COOKIE)?.value;
    return token ? readToken(token) : null;
  } catch {
    return null;
  }
}

export async function clearSession() {
  try {
    (await cookies()).delete(COOKIE);
  } catch {}
}
