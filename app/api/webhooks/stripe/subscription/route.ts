import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/app/utils/db";
import { SubscriptionPlan } from "@prisma/client";

// Initialize Stripe with the API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16" as any, // Type assertion to bypass version check
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET_SUBSCRIPTION || ""
    );
    
    console.log('Received webhook event:', event.type);
  } catch (error: any) {
    console.error(`Webhook Error: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Processing checkout session:', session.id);
        
        if (!session.subscription || !session.customer) {
          throw new Error("Missing subscription or customer info");
        }

        // Immediately retrieve subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const userId = session.metadata?.userId;
        const planType = session.metadata?.planId as SubscriptionPlan;

        if (!userId || !planType) {
          console.error("Missing metadata:", { userId, planType });
          throw new Error("Missing user ID or plan type in session metadata");
        }

        // Calculate period end date
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        
        console.log('Setting subscription details:', {
          userId,
          planType,
          status: "ACTIVE",
          currentPeriodEnd,
          subscriptionId: subscription.id
        });

        // Use prisma transaction to ensure all updates happen together
        await prisma.$transaction([
          prisma.subscription.upsert({
            where: { userId },
            create: {
              userId,
              planType,
              status: "ACTIVE",
              stripeSubscriptionId: subscription.id,
              stripeCustomerId: session.customer as string,
              currentPeriodEnd,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
            update: {
              planType,
              status: "ACTIVE",
              stripeSubscriptionId: subscription.id,
              stripeCustomerId: session.customer as string,
              currentPeriodEnd,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
          }),
          prisma.user.update({
            where: { id: userId },
            data: { invoiceCount: 0 },
          })
        ]);

        console.log('Successfully activated subscription for user:', userId);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription || !invoice.customer) break;

        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        
        await prisma.subscription.updateMany({
          where: { 
            stripeCustomerId: invoice.customer as string,
            stripeSubscriptionId: invoice.subscription as string
          },
          data: {
            status: "ACTIVE",
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        });

        console.log('Updated subscription period for customer:', invoice.customer);
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: subscription.status === "active" ? "ACTIVE" : "INACTIVE",
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });
        
        console.log('Updated subscription status:', subscription.id);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}