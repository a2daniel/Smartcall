import { NextRequest, NextResponse } from 'next/server';

const protectedRoutes = [
  { path: '/manager/dashboard', role: 'MANAGER' },
  { path: '/staff/shifts', role: 'STAFF' },
  { path: '/admin', role: 'ADMIN' },
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = req.cookies.get('session')?.value;
  if (!session) {
    if (protectedRoutes.some(r => pathname.startsWith(r.path))) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    return NextResponse.next();
  }
  let user;
  try {
    user = JSON.parse(session);
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  for (const route of protectedRoutes) {
    if (pathname.startsWith(route.path) && user.role !== route.role) {
      // Redirect to correct dashboard based on user role
      const redirectUrl = user.role === 'ADMIN' ? '/admin' : 
                         user.role === 'MANAGER' ? '/manager/dashboard' : 
                         '/staff/shifts';
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/manager/dashboard', '/staff/shifts', '/admin'],
}; 