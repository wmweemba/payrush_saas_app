import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function middleware(request) {
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
