"use server";

import { redirect } from "next/navigation";
import prisma from "../utils/db";
import { initializeStripe } from "../utils/stripe";

export async function createStripeCheckoutSession(id: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      User: {
        select: {
          id: true,
          stripeSettings: {
            select: {
              isConnected: true,
            }
          },
        },
      },
    },
  });

  if (!invoice?.User?.id) {
    throw new Error("Invoice not found");
  }

  if (!invoice.User.stripeSettings?.isConnected) {
    throw new Error("Stripe not configured for this user");
  }

  const stripe = await initializeStripe(invoice.User.id);
  if (!stripe) {
    throw new Error("Failed to initialize Stripe");
  }

  try {
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
            unit_amount: invoice.total * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoice/view/${id}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoice/view/${id}`,
      metadata: {
        invoiceId: id,
        userId: invoice.User.id,
      },
      customer_email: invoice.clientEmail,
    });

    await prisma.invoice.update({
      where: { id },
      data: {
        stripeCheckoutSessionId: session.id,
        paymentLink: session.url || undefined,
        paymentMethod: "STRIPE",
      },
    });

    if (!session.url) {
      throw new Error("Failed to create checkout session");
    }

    return { success: true, url: session.url };
  } catch (error) {
    console.error("Stripe checkout creation failed:", error);
    throw new Error("Failed to create payment session");
  }
}