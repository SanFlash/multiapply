import { cookies } from 'next/headers';

const COOKIE = 'multiapply_session';
const MAX_AGE = 60 * 60 * 24 * 30;

export type Session = {
  email: string;
  name?: string;
  authenticated: true;
};

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

export async function setSession(session: Session) {
  const payload = encode(JSON.stringify(session));

  (await cookies()).set(COOKIE, payload, {
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

    const parsed = JSON.parse(decode(value)) as Partial<Session>;

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

export async function clearSession() {
  try {
    (await cookies()).delete(COOKIE);
  } catch {
    // Ignore cookie cleanup errors.
  }
}
