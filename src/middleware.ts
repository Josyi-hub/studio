
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Regex for public files
const PUBLIC_FILE = /\.(.*)$/;

// Public paths that do not require authentication
// Note: With client-side auth handling, middleware's role in auth is reduced.
// These paths are still useful for logic that might run irrespective of auth,
// or if server-side auth checks are added later.
// const PUBLIC_PATHS = ['/login', '/signup']; // Not strictly needed for current client-side auth redirection logic

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow requests for static files and API routes to pass through.
  // The `config.matcher` below already broadly defines what the middleware acts upon.
  if (
    pathname.startsWith('/_next') || // Next.js internal assets
    pathname.startsWith('/api') ||   // API routes
    PUBLIC_FILE.test(pathname)       // Static files (images, fonts, etc.)
  ) {
    return NextResponse.next();
  }

  // At this point, authentication-based redirection is primarily handled client-side
  // using the `useAuth` hook and `useEffect` in individual pages or layouts.
  // This middleware is simplified to avoid conflicts with client-side Firebase Auth state.
  // It can be extended later for other purposes (e.g., internationalization, A/B testing headers).

  return NextResponse.next();
}

// Specify paths for the middleware to run on.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * This ensures the middleware focuses on page routes.
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
