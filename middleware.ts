import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Protected routes 5HI-2#2#@I2*9H#0
  const protectedRoutes = ['/tracking']
  
  // #'*-'H2@G protected route +#7-D!H
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  if (isProtectedRoute) {
    // #'*- token 2 cookies +#7- headers
    const token = request.cookies.get('auth-token')?.value
    const authHeader = request.headers.get('authorization')
    
    // I2D!H!5 token C+I redirect D+I2 login
    if (!token && !authHeader) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }
  
  // I2@G public route +#7-!5 token C+IH2D
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}