import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'reown-spends-fallback-secret-at-least-64-chars-long-1234567890';

// Ensure the secret is converted to a Uint8Array for jose
const getSecretKey = () => {
  return new TextEncoder().encode(JWT_SECRET);
};

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  rememberMe: boolean;
}

/**
 * Sign a JWT token using jose
 */
export async function signJWT(payload: JWTPayload, expiresInDays: number = 7): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInDays * 24 * 60 * 60; // Expiration in seconds

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(getSecretKey());
}

/**
 * Verify a JWT token using jose
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ['HS256'],
    });
    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error('JWT Verification failed:', error);
    return null;
  }
}
