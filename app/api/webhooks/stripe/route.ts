import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/app/utils/db";

// Initialize Stripe with the API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (error: any) {
    console.error(`Webhook Error: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Update the invoice status to PAID
      if (session.metadata?.invoiceId) {
        await prisma.invoice.update({
          where: { id: session.metadata.invoiceId },
          data: {
            status: "PAID",
            paidAt: new Date(),
            stripeCheckoutSessionId: session.id,
            paymentMethod: "STRIPE",
          },
        });
      }
      break;

    case "payment_intent.succeeded":
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      // Update the invoice status to PAID if it's linked to an invoice
      if (paymentIntent.metadata?.invoiceId) {
        await prisma.invoice.update({
          where: { id: paymentIntent.metadata.invoiceId },
          data: {
            status: "PAID",
            paidAt: new Date(),
            stripePaymentIntentId: paymentIntent.id || '',
            paymentMethod: "STRIPE",
          },
        });
      }
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}