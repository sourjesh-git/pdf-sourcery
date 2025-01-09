import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const publicPaths = ["/", "/api/webhook", "/sign-in", "/sign-up"];

function isPublic(path: string) {
  return publicPaths.find((x) => 
    path.match(new RegExp(`^${x}`))
  );
}

export default clerkMiddleware(async (auth, request) => {
  if (isPublic(request.nextUrl.pathname)) {
    return NextResponse.next();
  }
  
  const resolvedAuth = await auth();
  // If no session exists and path is not public, redirect to sign-in
  if (!resolvedAuth.userId && !isPublic(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
    "/"
  ],
};