import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  // Run middleware only on protected routes
  matcher: [
    '/profile/:path*',
    '/admin/:path*',
    '/manager/:path*',
    '/cart/:path*',
    '/checkout/:path*',
    '/user-info/:path*',
  ],
}
