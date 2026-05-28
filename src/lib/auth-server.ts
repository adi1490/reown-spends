import { verifyJWT } from './auth-jwt';

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  rememberMe: boolean;
}

/**
 * Extracts and verifies the user session from the request headers/cookies.
 * Returns the decoded JWTPayload or null if unauthorized.
 */
export async function getCurrentUser(request: Request): Promise<UserSession | null> {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => c.trim().split('='))
    );
    const sessionToken = cookies['reown_spends_session'];

    if (!sessionToken) {
      return null;
    }

    const payload = await verifyJWT(sessionToken);
    if (!payload || !payload.userId) {
      return null;
    }

    return payload as unknown as UserSession;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
