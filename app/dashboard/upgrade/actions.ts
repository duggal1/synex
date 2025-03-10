"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/app/utils/db";
import { requireUser } from "@/app/utils/hooks";
import { PaymentStatus, SubscriptionPlan } from "@prisma/client";
import Stripe from "stripe";
import { CheckInvoiceLimitResult } from "@/app/utils/types";

// Initialize Stripe with the API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia" , // Type assertion to bypass version check
});

interface SubscriptionData {
  planType: SubscriptionPlan | "FREE";
  status: PaymentStatus | "INACTIVE";
  currentPeriodEnd?: Date | null;
}

export async function getCurrentSubscription(): Promise<{ 
  success: true; 
  data: SubscriptionData;
} | {
  success: false;
  error: string;
}> {
  try {
    const session = await requireUser();
    const userId = session.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: {
        planType: true,
        status: true,
        currentPeriodEnd: true,
      },
    });

    return {
      success: true,
      data: subscription || { planType: "FREE", status: "INACTIVE" },
    };
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return { success: false, error: "Failed to fetch subscription" };
  }
}

// Stripe price IDs for each plan
const STRIPE_PRICE_IDS = {
  pro_monthly: process.env.STRIPE_PRICE_ID_MONTHLY ,
  pro_yearly: process.env.STRIPE_PRICE_ID_YEARLY ,
};

const PLAN_TYPE_MAP: { [key: string]: SubscriptionPlan } = {
  pro_monthly: SubscriptionPlan.PRO_MONTHLY,
  pro_yearly: SubscriptionPlan.PRO_YEARLY,
};

const calculateAnnualPricing = (monthlyPrice: number) => {
  const annualCost = monthlyPrice * 12;
  const baseDiscount = 0.40;
  return Math.floor(annualCost * (1 - baseDiscount));
};

// Update the price IDs based on the calculated prices
const STRIPE_PRICE_MAP = {
  pro_monthly: {
    id: process.env.STRIPE_PRICE_ID_MONTHLY,
    price: 19.99
  },
  pro_yearly: {
    id: process.env.STRIPE_PRICE_ID_YEARLY,
    price: calculateAnnualPricing(19.99)
  }
};

export async function initializePayment(planId: string) {
  try {
    const session = await requireUser();
    const userId = session.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user?.email) {
      throw new Error("User email not found");
    }

    const planConfig = STRIPE_PRICE_MAP[planId as keyof typeof STRIPE_PRICE_MAP];
    if (!planConfig?.id) {
      throw new Error("Invalid plan selected");
    }

    const planType = PLAN_TYPE_MAP[planId];
    if (!planType) {
      throw new Error("Invalid plan selected");
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: planConfig.id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/upgrade?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/upgrade?canceled=true`,
      customer_email: user.email,
      metadata: {
        userId,
        planId: planType, // Send the actual enum value
        calculatedPrice: planConfig.price.toString(),
      },
      billing_address_collection: "auto",
      allow_promotion_codes: true,
    });

    // Update subscription status to pending
    await prisma.subscription.upsert({
      where: { userId },
      update: {
        planType,
        status: "PENDING",
      },
      create: {
        userId,
        planType,
        status: "PENDING",
      },
    });

    return {
      success: true,
      checkoutUrl: checkoutSession.url,
    };
  } catch (error) {
    console.error("Error initializing payment:", error);
    return { success: false, error: "Failed to initialize payment" };
  }
}

// Create a Stripe checkout session with client secret for embedded checkout
export async function createCheckoutSession(planId: string) {
  try {
    const session = await requireUser();
    const userId = session.user?.id;

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user?.email) {
      throw new Error("User email not found");
    }

    const planConfig = STRIPE_PRICE_MAP[planId as keyof typeof STRIPE_PRICE_MAP];
    if (!planConfig?.id) {
      throw new Error("Invalid plan selected");
    }

    const planType = PLAN_TYPE_MAP[planId];
    if (!planType) {
      throw new Error("Invalid plan selected");
    }

    // Create checkout session with embedded mode
    const checkoutSession = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      payment_method_types: ["card"],
      line_items: [
        {
          price: planConfig.id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/upgrade?session_id={CHECKOUT_SESSION_ID}`,
      customer_email: user.email,
      metadata: {
        userId,
        planId: planType,
        calculatedPrice: planConfig.price.toString(),
      },
      billing_address_collection: "auto",
      allow_promotion_codes: true,
    });

    // Update subscription status to pending
    await prisma.subscription.upsert({
      where: { userId },
      update: {
        planType,
        status: "PENDING",
      },
      create: {
        userId,
        planType,
        status: "PENDING",
      },
    });

    return {
      success: true,
      clientSecret: checkoutSession.client_secret,
    };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return { success: false, error: "Failed to create checkout session" };
  }
}

// Retrieve a checkout session
export async function getCheckoutSession(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // If session is complete, immediately update subscription status
    if (session.status === 'complete' && session.metadata?.userId) {
      // Fetch the subscription details to get current_period_end
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

      await prisma.subscription.update({
        where: { userId: session.metadata.userId },
        data: {
          status: "ACTIVE",
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          currentPeriodEnd: currentPeriodEnd,
          // Reset invoice count
          user: {
            update: {
              invoiceCount: 0
            }
          }
        },
      });
      
      console.log('Updated subscription status to ACTIVE for user:', session.metadata.userId, {
        currentPeriodEnd,
        stripeSubscriptionId: session.subscription
      });
    }
    
    return { success: true, session };
  } catch (error) {
    console.error("Error retrieving checkout session:", error);
    return { success: false, error: "Failed to retrieve checkout session" };
  }
}
export async function checkInvoiceLimit(userId: string): Promise<CheckInvoiceLimitResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true
      }
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Debug log
    console.log('Checking subscription status:', {
      userId,
      subscriptionStatus: user.subscription?.status,
      subscriptionPlan: user.subscription?.planType,
      currentPeriodEnd: user.subscription?.currentPeriodEnd
    });

    // Check if user has an active subscription
    if (user.subscription?.status === "ACTIVE") {
      return {
        success: true,
        hasSubscription: true,
        message: "Active subscription found",
        plan: user.subscription.planType
      };
    }

    // Check free plan limits
    if (user.invoiceCount >= 3) {
      return {
        success: false,
        error: "Free plan limit reached",
        shouldUpgrade: true,
        hasSubscription: false
      };
    }

    return {
      success: true,
      hasSubscription: false,
      message: "Free plan active"
    };

  } catch (error) {
    console.error("Error checking invoice limit:", error);
    return {
      success: false,
      error: "Failed to check invoice limit",
      hasSubscription: false
    };
  }
}

export async function incrementInvoiceCount(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        invoiceCount: {
          increment: 1,
        },
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Error incrementing invoice count:", error);
    return { success: false, error: "Failed to update invoice count" };
  }
}