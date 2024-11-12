import { authMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export default authMiddleware({
    publicRoutes: [
        "/",
        "/auth/sign-in",
        "/auth/sign-up",
        "/auth/error",
        "/auth/callback",
        "/api/uploadthing",
        "/api/webhook(.*)",
    ],

    async afterAuth(auth, req) {
        const { userId } = auth;
        const { pathname } = req.nextUrl;

        // Handle non-authenticated routes
        if (!userId) {
            if (pathname.startsWith('/dashboard')) {
                const signInUrl = new URL('/auth/sign-in', req.url);
                signInUrl.searchParams.set('redirectTo', pathname);
                return NextResponse.redirect(signInUrl);
            }
            return NextResponse.next();
        }

        // Handle authenticated routes
        if (pathname.startsWith('/auth')) {
            // Don't redirect these specific auth routes
            if (pathname === '/auth/callback') {
                return NextResponse.next();
            }
            // Redirect to dashboard for all other auth routes when user is signed in
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }

        try {
            const user = await prisma.user.findUnique({
                where: { clerkId: auth.userId }
            });

            if (!user && auth.userId) {
                // Force create user if not exists
                await prisma.user.create({
                    data: {
                        clerkId: auth.userId,
                        email: auth.sessionClaims?.email as string,
                        name: auth.sessionClaims?.firstName as string,
                        lastLoginAt: new Date(),
                        subscriptionStatus: 'FREE',
                        usageLimit: 10
                    }
                });
            }
        } catch (error) {
            console.error("Middleware DB sync failed:", error);
        }

        return NextResponse.next();
    },
});
//
export const config = {
    matcher: [
        "/((?!.+\\.[\\w]+$|_next).*)",
        "/",
        "/(api|trpc)(.*)",
    ],
};