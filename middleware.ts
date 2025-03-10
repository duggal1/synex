import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Cache for session checks to avoid repeated cookie parsing
const sessionCache = new Map<string, boolean>();

export function middleware(request: NextRequest) {
  // Create a unique key for this request based on URL and cookies
  const cookiesStr = request.cookies.toString();
  const requestId = request.url + (cookiesStr || "");
  
  // Check if we've already determined authentication for this request
  if (sessionCache.has(requestId)) {
    const isAuthenticated = sessionCache.get(requestId);
    
    // Fast path for authenticated users
    if (isAuthenticated && 
        (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/verify") && 
        !request.nextUrl.search.includes("error=")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    
    // Fast path for unauthenticated users
    if (!isAuthenticated && request.nextUrl.pathname.startsWith("/dashboard")) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(loginUrl);
    }
    
    return NextResponse.next();
  }
  
  // Check if user is authenticated by looking for the session cookie
  const isAuthenticated = request.cookies.has("next-auth.session-token") || 
                          request.cookies.has("__Secure-next-auth.session-token");
  
  // Cache the result for future requests
  sessionCache.set(requestId, isAuthenticated);
  
  // Limit cache size to prevent memory leaks
  if (sessionCache.size > 100) {
    const firstKey = sessionCache.keys().next().value;
    if (firstKey) {
      sessionCache.delete(firstKey);
    }
  }

  // Only protect dashboard routes
  if (!isAuthenticated && request.nextUrl.pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Only redirect from login/verify pages if authenticated
  if (isAuthenticated && 
      (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/verify") && 
      !request.nextUrl.search.includes("error=")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Only apply middleware to these specific routes
export const config = {
  matcher: [
    // Protected routes
    "/dashboard/:path*",
    // Auth pages (but not API routes or error pages)
    "/login",
    "/verify"
  ],
}; 