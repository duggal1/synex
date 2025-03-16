import { redirect } from "next/navigation";
import { auth } from "./auth";
import { cache } from "react";
import prisma from "./db";

// Cache the auth result to avoid repeated database queries
export const getAuthSession = cache(async () => {
  try {
    const session = await auth();
    if (!session?.user) return null;

    // Get user with subscription status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscription: {
          select: {
            status: true,
            planType: true
          }
        }
      }
    });

    return {
      ...session,
      user: {
        ...session.user,
        ...user,
        isSubscribed: user?.subscription?.status === "ACTIVE"
      }
    };
  } catch (error) {
    console.error("Error in getAuthSession:", error);
    return null;
  }
});

export async function requireUser() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

// Helper to get subscription status
export async function getUserSubscriptionStatus(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { 
      status: true,
      planType: true,
      currentPeriodEnd: true 
    }
  });

  return {
    isSubscribed: subscription?.status === "ACTIVE",
    plan: subscription?.planType,
    expiryDate: subscription?.currentPeriodEnd
  };
}
