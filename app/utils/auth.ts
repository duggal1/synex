import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { DefaultSession, User as NextAuthUser } from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import Google from "next-auth/providers/google";
import prisma from "./db";

// Define base properties we want to extend
interface UserExtensions {
  emailVerified?: Date | null;
  email?: string | null;
  image?: string | null;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
  
  interface User extends UserExtensions {}
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
      authorization: {
        params: {
          prompt: "consent",
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
        if (!user.email) {
          return true;
        }

        let firstName = undefined;
        let lastName = undefined;
        if (profile?.name) {
          const nameParts = profile.name.split(' ');
          firstName = nameParts[0];
          lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined;
        }

        // Find existing user and their accounts
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: {
            id: true,
            accounts: {
              select: {
                provider: true,
                providerAccountId: true
              }
            }
          },
        });

        // If no user exists, create new user
        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: user.email,
              firstName,
              lastName,
              image: user.image,
              emailVerified: user.emailVerified || new Date(),
            },
          });
          return true;
        }

        // If user exists and this is a new account, link it
        if (account && !existingUser.accounts.some(acc => 
          acc.provider === account.provider && 
          acc.providerAccountId === account.providerAccountId
        )) {
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
        }

        // Always allow sign in
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle OAuthAccountNotLinked error by redirecting to dashboard
      if (url.includes("error=OAuthAccountNotLinked")) {
        return `${baseUrl}/dashboard`;
      }
      
      // Allow relative URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // Allow same-origin URLs
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
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