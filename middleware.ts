import { auth } from "@/auth";
import { NextResponse } from "next/server";

const onBoardingPath = '/setup';

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session?.user;

  const isOnAdmin = nextUrl.pathname.startsWith('/admin');

  // If user is logged in and is marked as first login
  if (session?.user?.isFirstLogin) {
    // Prevent redirect loop if already on setup page or hitting an API/resource
    if (nextUrl.pathname !== onBoardingPath) {
       return NextResponse.redirect(new URL(onBoardingPath, nextUrl));
    }
    return NextResponse.next();
  }

  // If user is NOT first login but tries to access /setup, redirect to home
  if (!session?.user?.isFirstLogin && nextUrl.pathname === onBoardingPath) {
      return NextResponse.redirect(new URL('/', nextUrl));
  }

  if (isOnAdmin) {
    if (isLoggedIn) return NextResponse.next();
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|images|videos|favicon.ico).*)'],
};
