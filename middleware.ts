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

const isAuthPage = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  // Redirect signed-in users away from auth pages
  if (userId && isAuthPage(req)) {
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
