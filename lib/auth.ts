import { jwtVerify, SignJWT } from 'jose';

export const AUTH_COOKIE_NAME = 'siapkb_session';

const getJwtSecretKey = () => {
  const secret = process.env.DASHBOARD_SESSION_TOKEN || 'fallback-secret-key-siapkb-change-me';
  return new TextEncoder().encode(secret);
};

export async function signToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getJwtSecretKey());
}

export async function verifyToken(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return payload;
  } catch (err) {
    return null;
  }
}

export async function getSession(cookieValue?: string) {
  if (!cookieValue) return null;

  // Fallback ke pengecekan statis jika cookieValue bukan JWT yang valid tapi sama dengan DASHBOARD_SESSION_TOKEN
  const expectedToken = process.env.DASHBOARD_SESSION_TOKEN;
  if (expectedToken && cookieValue === expectedToken) {
    // If it's the old static token, we assume it's superadmin for compatibility, 
    // but ideally they should re-login to get a JWT.
    return { role: 'superadmin', name: 'Super Admin' };
  }

  const payload = await verifyToken(cookieValue);
  return payload;
}

export async function isSessionValid(cookieValue?: string) {
  const session = await getSession(cookieValue);
  return session !== null;
}
