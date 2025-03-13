import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { DefaultSession } from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import Google from "next-auth/providers/google";
import prisma from "./db";


declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Optimize Google auth settings
      authorization: {
        params: {
          prompt: "consent", // Changed from "select_account" to "consent" for faster auth
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    Nodemailer({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/verify",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Fast path: if no email, allow sign in
        if (!user.email) {
          return true;
        }

        // Optimized query - only fetch what's actually needed
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: {
            id: true,
            accounts: {
              where: account ? { 
                provider: account.provider,
              } : undefined,
              select: {
                providerAccountId: true,
                provider: true
              }
            }
          },
        });

        // If no user exists with this email, allow sign in
        if (!existingUser) {
          return true;
        }

        // If this account is already linked to the user, allow sign in
        if (account && existingUser.accounts.some(
          (acc) => acc.provider === account.provider && acc.providerAccountId === account.providerAccountId
        )) {
          return true;
        }

        // If user exists but no account with this provider, link the new account
        if (account) {
          await prisma.account.create({
            data: {
              userId: existingUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token as string | null,
              access_token: account.access_token as string | null,
              expires_at: account.expires_at,
              token_type: account.token_type as string | null,
              scope: account.scope as string | null,
              id_token: account.id_token as string | null,
              session_state: account.session_state as string | null,
            },
          });
          
          // Return true to allow sign in after linking account
          return true;
        }

        // Default allow sign in
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      // Only add minimal required data to token
      if (user) {
        token.id = user.id as string;
        // No need to duplicate email, it's already in the token
      }
      
      // Only store provider information
      if (account) {
        token.provider = account.provider;
      }
      
      return token;
    },
    async session({ session, token }) {
      // Use data from token instead of fetching from database again
      if (session.user) {
        session.user.id = token.id as string ?? token.sub!;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Simplified and optimized redirect logic
      try {
        // Fast path for OAuthAccountNotLinked error
        if (url.includes("error=OAuthAccountNotLinked")) {
          return `${baseUrl}/dashboard`;
        }
        
        // Allows relative callback URLs
        if (url.startsWith("/")) return `${baseUrl}${url}`;
        // Allows callback URLs on the same origin
        if (new URL(url).origin === baseUrl) return url;
        
        return baseUrl;
      } catch (error) {
        console.error("Error in redirect callback:", error);
        return baseUrl;
      }
    },
  },
  trustHost: true,
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
  },
});