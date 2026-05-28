import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware for tenant context isolation and authentication
 * Enforces multi-tenancy, protects routes, and sets tenant headers
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/forgot-password', '/', '/api/auth'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Get auth token from cookies
  const authToken = request.cookies.get('auth_token')?.value;
  const tenantId = request.cookies.get('tenant_id')?.value;
  const outletId = request.cookies.get('outlet_id')?.value;

  // Redirect to login if not authenticated and trying to access protected route
  if (!isPublicRoute && !authToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to POS if authenticated and trying to access login/register
  if (isPublicRoute && authToken && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/pos', request.url));
  }

  // Create response
  const response = NextResponse.next();

  // Set tenant context headers for API calls
  if (tenantId) {
    response.headers.set('X-Tenant-ID', tenantId);
  }

  if (outletId) {
    response.headers.set('X-Outlet-ID', outletId);
  }

  if (authToken) {
    response.headers.set('Authorization', `Bearer ${authToken}`);
  }

  return response;
}

// Configure which routes should use middleware
export const config = {
  matcher: [
    // Protect all routes except static files and public assets
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sw.js).*)',
  ],
};
