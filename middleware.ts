import { auth } from "@/auth";
import { NextResponse } from "next/server";

const onBoardingPath = '/';

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session?.user;

  const isOnAdmin = nextUrl.pathname.startsWith('/admin');

  if (session?.user?.isFirstLogin) {
    if (nextUrl.pathname !== onBoardingPath) {
      return NextResponse.redirect(new URL(onBoardingPath, nextUrl));
    }
    return NextResponse.next();
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
