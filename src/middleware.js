import { NextResponse } from "next/server";

export  function middleware(req) {
    const token =
    req.cookies.get("__Secure-better-auth.session_token") ||
    req.cookies.get("better-auth.session_token");
    const isAuthPage =
     req.nextUrl.pathname === "/" ||
    req.nextUrl.pathname === "/signup";

    if(!token && req.nextUrl.pathname.startsWith('/dashboard')){
        return  NextResponse.redirect(
            new URL('/', req.url)
        )
    }
    if(token && isAuthPage){
        return NextResponse.redirect(
            new URL('/dashboard',req.url)
        )
    }
  return  NextResponse.next()
    
} 

export const config = {
  matcher: ["/dashboard/:path*", "/", "/signup"],
};