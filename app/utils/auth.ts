import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import Google from "next-auth/providers/google";
import prisma from "./db";

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
      authorization: {
        params: {
          prompt: "select_account",
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
        // If there's no email, allow sign in
        if (!user.email) {
          return true;
        }

        // Check if user exists with this email
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { accounts: true },
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
      // Add user data to token for faster access
      if (user) {
        token.id = user.id as string;
        token.email = user.email as string;
      }
      
      // Keep the account info in the token for faster provider-specific operations
      if (account) {
        token.provider = account.provider;
      }
      
      return token;
    },
    async session({ session, token }) {
      // Use data from token instead of fetching from database again
      if (session.user) {
        session.user.id = token.sub || (token.id as string);
        // Add any other user data you need from token
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      try {
        // Special case for OAuthAccountNotLinked error
        // Instead of redirecting to error page, redirect directly to dashboard
        if (url.includes("error=OAuthAccountNotLinked")) {
          return `${baseUrl}/dashboard`;
        }
        
        // Fast path for dashboard redirects
        if (url.includes("/dashboard")) {
          return url;
        }
        
        // Allows relative callback URLs
        if (url.startsWith("/")) return `${baseUrl}${url}`;
        // Allows callback URLs on the same origin
        else if (new URL(url).origin === baseUrl) return url;
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
