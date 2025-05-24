
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Add paths that should be publicly accessible
const PUBLIC_FILE = /\.(.*)$/; // Allow static files
const PUBLIC_PATHS = ['/login', '/signup']; // Auth pages

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get('firebaseIdToken'); // Or whatever cookie Firebase Auth sets

  // Allow requests for static files and public paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') || // Allow API routes
    PUBLIC_FILE.test(pathname) ||
    PUBLIC_PATHS.includes(pathname)
  ) {
    return NextResponse.next();
  }

  // If no session token and trying to access a protected route, redirect to login
  if (!sessionToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectedFrom', pathname); // Optional: pass redirect info
    return NextResponse.redirect(loginUrl);
  }
  
  // If session token exists and trying to access login/signup, redirect to dashboard
  if (sessionToken && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Specify paths for the middleware to run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * This is a common pattern but for Firebase Auth, we primarily care about page routes.
     * Let's simplify to run on all page routes, and explicitly allow public ones.
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
