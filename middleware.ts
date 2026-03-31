import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/onboarding',
  '/report/(.*)',
  '/invite/(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  const url = req.nextUrl

  // If signed in and trying to access sign-in or sign-up, redirect to spend
  if (userId && (url.pathname.startsWith('/sign-in') || url.pathname.startsWith('/sign-up'))) {
    return NextResponse.redirect(new URL('/spend', req.url))
  }

  // Protect all non-public routes
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ['/((?!.*\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
