import { NextResponse, type NextRequest } from 'next/server'
import { getUserFromCookie } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const tokenUser = getUserFromCookie(request.cookies)
  const isAuthenticated = !!tokenUser
  const isLoggedInForRedirect = isAuthenticated

  // Protect dashboard
  if (!isAuthenticated && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  // Redirect if already logged in
  if (isLoggedInForRedirect && (request.nextUrl.pathname === '/signin' || request.nextUrl.pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/signin', '/signup'],
}