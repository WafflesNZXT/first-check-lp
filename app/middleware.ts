import { NextResponse, type NextRequest } from 'next/server'
import { getUserFromCookie } from '@/lib/auth'

function hasSupabaseSessionCookie(request: NextRequest) {
  const cookies = request.cookies.getAll()
  return cookies.some((cookie) => {
    const name = cookie.name
    return (
      name === 'sb-access-token' ||
      name === 'sb-refresh-token' ||
      /(^sb-.*-auth-token$)|(^sb-auth-token$)|(^sb-.*-refresh-token$)|(^sb-.*-access-token$)/.test(name)
    )
  })
}

export async function middleware(request: NextRequest) {
  const tokenUser = getUserFromCookie(request.cookies)
  const isAuthenticated = !!tokenUser || hasSupabaseSessionCookie(request)
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