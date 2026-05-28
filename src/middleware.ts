import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/auth-jwt';

// Define protected page routes
const PROTECTED_PAGES = ['/', '/expenses', '/activity', '/export', '/settings'];

// Define protected API routes (backup cron checks its own secret inside the route handler)
const PROTECTED_APIS = ['/api/expenses', '/api/insights', '/api/activity', '/api/upload', '/api/auth/change-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get('reown_spends_session')?.value;

  // 1. Verify token
  let session = null;
  if (sessionToken) {
    session = await verifyJWT(sessionToken);
  }

  const isApiRoute = pathname.startsWith('/api/');
  const isLoginPage = pathname === '/login';

  // 2. Check protection
  const isPageProtected = PROTECTED_PAGES.some(
    (page) => pathname === page || (page !== '/' && pathname.startsWith(`${page}/`))
  );
  
  const isApiProtected = PROTECTED_APIS.some(
    (api) => pathname === api || pathname.startsWith(`${api}/`)
  );

  // 3. Unauthenticated access to protected resources
  if (!session) {
    if (isApiProtected) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 });
    }
    if (isPageProtected) {
      const loginUrl = new URL('/login', request.url);
      // Optional: keep track of redirect page
      if (pathname !== '/') {
        loginUrl.searchParams.set('callbackUrl', pathname);
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4. Authenticated user trying to access login page
  if (session && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// See Next.js middleware configuration matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public folder files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
