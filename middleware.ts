import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Protected routes
  const protectedRoutes = ['/tracking']
  const adminRoutes = ['/admin']
  
  // ตรวจสอบ admin routes
  const isAdminRoute = adminRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // ตรวจสอบ protected routes
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  if (isAdminRoute || isProtectedRoute) {
    // ดึง token จาก cookies หรือ headers
    const token = request.cookies.get('auth-token')?.value || 
                  request.cookies.get('token')?.value
    const authHeader = request.headers.get('authorization')
    
    // ไม่มี token ให้ redirect ไปหน้า login
    if (!token && !authHeader) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const tokenToVerify = token || authHeader?.replace('Bearer ', '')
    
    if (tokenToVerify) {
      try {
        const decoded = jwt.verify(tokenToVerify, process.env.JWT_SECRET || 'fallback-secret') as { userId: string; role: string }
        
        // ตรวจสอบ admin routes - เฉพาะ ADMIN เท่านั้น
        if (isAdminRoute && decoded.role !== 'ADMIN') {
          return NextResponse.redirect(new URL('/tracking', request.url))
        }
        
        // ตรวจสอบ protected routes (/tracking) - ป้องกัน ADMIN เข้า
        if (isProtectedRoute && decoded.role === 'ADMIN') {
          return NextResponse.redirect(new URL('/admin', request.url))
        }
        
      } catch {
        // Token ไม่ถูกต้องให้ redirect ไปหน้า login
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }
  }
  
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