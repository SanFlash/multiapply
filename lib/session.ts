import { cookies } from 'next/headers';
import { EncryptJWT, jwtDecrypt } from 'jose';

const COOKIE = 'multiapply_session';

function getKey() {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) return null;
  return new TextEncoder().encode(secret.padEnd(32, '0').slice(0, 32));
}

export type Session = {
  email: string;
  name?: string;
  authenticated: true;
};

export async function setSession(session: Session) {
  const secret = process.env.SESSION_SECRET?.trim();

  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters');
  }

  const key = new TextEncoder().encode(secret.padEnd(32, '0').slice(0, 32));

  const token = await new EncryptJWT(session)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .encrypt(key);

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 2592000,
  });
}

export async function getSession(): Promise<Session | null> {
  try {
    const value = (await cookies()).get(COOKIE)?.value;
    const key = getKey();

    if (!value || !key) return null;

    return (await jwtDecrypt(value, key)).payload as unknown as Session;
  } catch {
    return null;
  }
}

export async function clearSession() {
  try {
    (await cookies()).delete(COOKIE);
  } catch {
    // Ignore invalid/expired session state.
  }
}
