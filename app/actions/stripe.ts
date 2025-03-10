"use server";

import { redirect } from "next/navigation";
import Stripe from "stripe";
import prisma from "../utils/db";

// Initialize Stripe with the API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

export async function createStripeCheckoutSession(id: string) {
  // Get the invoice details
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      User: {
        select: {
          stripeSettings: true,
        },
      },
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  // Check if the user has Stripe connected
  if (!invoice.User?.stripeSettings?.isConnected) {
    throw new Error("Stripe is not connected for this user");
  }

  // Create a Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: invoice.currency.toLowerCase(),
          product_data: {
            name: invoice.invoiceName,
            description: `Invoice #${invoice.invoiceNumber}`,
          },
          unit_amount: invoice.total * 100, // Stripe expects amounts in cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: process.env.NODE_ENV !== "production"
      ? `http://localhost:3000/invoice/view/${id}/success?session_id={CHECKOUT_SESSION_ID}`
      : `https://invoice-marshal.vercel.app/invoice/view/${id}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: process.env.NODE_ENV !== "production"
      ? `http://localhost:3000/invoice/view/${id}`
      : `https://invoice-marshal.vercel.app/invoice/view/${id}`,
    metadata: {
      invoiceId: invoice.id,
      userId: invoice.userId || "",
    },
    customer_email: invoice.clientEmail,
  });

  // Update the invoice with the checkout session ID
  await prisma.invoice.update({
    where: { id },
    data: {
      stripeCheckoutSessionId: session.id,
      paymentLink: session.url || undefined,
    },
  });

  // Redirect to the Stripe checkout page
  redirect(session.url || `/invoice/view/${id}`);
} 