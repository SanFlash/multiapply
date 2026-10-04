import { createHmac, timingSafeEqual } from 'crypto';

export const SESSION_COOKIE = 'multiapply_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

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

export function createSessionToken(session: Session) {
  const secret = getSecret();
  if (secret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters');
  }

  const payload = encode(JSON.stringify(session));
  return payload + '.' + sign(payload);
}

export function readSessionToken(token: string | undefined | null): Session | null {
  if (!token || !getSecret()) return null;

  const separator = token.lastIndexOf('.');
  if (separator <= 0) return null;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = sign(payload);

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);

  if (a.length !== b.length) return null;

  try {
    if (!timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

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

export function getSessionFromRequest(request: Request) {\n  const cookieHeader = request.headers.get('cookie') || '';\n  const match = cookieHeader\n    .split(';')\n    .map((part) => part.trim())\n    .find((part) => part.startsWith(SESSION_COOKIE + '='));\n\n  const token = match\n    ? decodeURIComponent(match.slice(SESSION_COOKIE.length + 1))\n    : undefined;\n\n  return readSessionToken(token);\n}\n\nexport function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE,
  };
}
