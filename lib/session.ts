import { cookies } from 'next/headers';
import { EncryptJWT, jwtDecrypt } from 'jose';
import { authEnv } from './config';

const COOKIE = 'multiapply_session';

function key() {
  return new TextEncoder()
    .encode(authEnv().SESSION_SECRET.padEnd(32, '0').slice(0, 32));
}

export type Session = {
  email: string;
  name?: string;
  authenticated: true;
};

export async function setSession(session: Session) {
  const token = await new EncryptJWT(session)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .encrypt(key());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 2592000,
  });
}

export async function getSession(): Promise<Session | null> {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return null;

  try {
    return (await jwtDecrypt(value, key())).payload as unknown as Session;
  } catch {
    return null;
  }
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}
