// middleware.ts
//woosh hackers woosh I said
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  // Get user from the request
  const user = await getUserFromRequest(request);
  
  // Define paths that require authentication
  const authRequiredPaths = [
    '/profile',
    '/checkout',
    '/orders',
  ];
  
  // Define paths that require admin role
  const adminRequiredPaths = [
    '/admin',
  ];
  
  // Define paths that should be redirected if already authenticated
  const guestOnlyPaths = [
    '/login',
    '/register',
  ];
  
  const path = request.nextUrl.pathname;
  
  // Check if user is authenticated for protected routes
  if (authRequiredPaths.some(p => path.startsWith(p)) && !user) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  
  // Check if user is admin for admin routes
  if (adminRequiredPaths.some(p => path.startsWith(p))) {
    if (!user) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
    
    if (user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  // Redirect already authenticated users from login/register pages
  if (guestOnlyPaths.some(p => path === p) && user) {
    const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
    const redirectUrl = callbackUrl || '/';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }
  
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    '/profile/:path*',
    '/admin/:path*',
    '/checkout/:path*',
    '/orders/:path*',
    '/login',
    '/register',
  ],
};