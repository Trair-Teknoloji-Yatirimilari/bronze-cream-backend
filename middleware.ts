import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Sadece gerekli header'ı ekle (breadcrumb için)
  response.headers.set('x-current-path', request.nextUrl.pathname)
  
  // Production'da güvenlik header'ları ekle
  if (process.env.NODE_ENV === 'production') {
    // XSS Protection
    response.headers.set('X-XSS-Protection', '1; mode=block')
    
    // Content Type Options
    response.headers.set('X-Content-Type-Options', 'nosniff')
    
    // Frame Options
    response.headers.set('X-Frame-Options', 'DENY')
    
    // Referrer Policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
