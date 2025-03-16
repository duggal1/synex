import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/app/utils/db";
import { initializeStripe } from "@/app/utils/stripe";
import { emailClient } from "@/app/utils/mailtrap";
import { formatCurrency } from "@/app/utils/formatCurrency";
import { CurrencyType } from "@/app/types/currency";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature") || "";

  if (!signature) {
    return NextResponse.json({ error: "No stripe signature" }, { status: 400 });
  }

  try {
    // Parse the raw body first
    const rawEvent = JSON.parse(body);
    const session = rawEvent.data.object;
    const userId = session.metadata?.userId;
    const invoiceId = session.metadata?.invoiceId;

    if (!userId || !invoiceId) {
      throw new Error("Missing metadata");
    }

    // Initialize Stripe with user's API key
    const stripe = await initializeStripe(userId);
    if (!stripe) {
      throw new Error("Could not initialize Stripe with user settings");
    }

    // Get user's stripe settings for webhook secret
    const stripeSettings = await prisma.stripeSettings.findUnique({
      where: { userId },
      select: { stripeSecretKey: true },
    });

    if (!stripeSettings?.stripeSecretKey) {
      throw new Error("Stripe settings not found");
    }

    // Verify webhook signature using webhook secret from environment
    const stripeEvent = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // Handle the payment success
    if (stripeEvent.type === "checkout.session.completed") {
      // Get invoice details
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          User: true
        }
      });

      if (!invoice || !invoice.User) {
        throw new Error("Invoice or user not found");
      }

      // Store payment details
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: "PAID",
          paidAt: new Date(),
          stripePaymentId: session.payment_intent as string,
          paymentMethod: "STRIPE",
          paymentDetails: {
            create: {
              amount: invoice.total,
              currency: invoice.currency,
              paymentIntentId: session.payment_intent as string,
              customerEmail: session.customer_email || '',
              paymentStatus: session.payment_status,
              paymentMethod: session.payment_method_types?.[0] || 'card',
              receiptEmail: session.customer_details?.email || '',
              receiptUrl: (session as any).payment_intent?.charges?.data?.[0]?.receipt_url || '',
            }
          }
        },
      });

      // Format amount for emails
      const formattedAmount = formatCurrency({
        amount: invoice.total,
        currency: invoice.currency as CurrencyType
      });

      // Send to business owner
      await emailClient.send({
        from: {
          email: "hello@synthicai.com",
          name: "Synex Invoices"
        },
        to: [{ email: invoice.User.email }],
        template_uuid: "payment-received-template",
        template_variables: {
          invoiceNumber: invoice.invoiceNumber,
          clientName: invoice.clientName,
          amount: formattedAmount,
          paymentDate: new Date().toLocaleDateString(),
          invoiceLink: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices/${invoice.id}`,
          paymentMethod: session.payment_method_types?.[0] || 'card',
          customerEmail: session.customer_email || invoice.clientEmail,
          receiptUrl: (session as any).payment_intent?.charges?.data?.[0]?.receipt_url || '',
        }
      });

      // Send to client
      await emailClient.send({
        from: {
          email: "hello@synthicai.com",
          name: invoice.fromName
        },
        to: [{ email: invoice.clientEmail }],
        template_uuid: "payment-confirmation-template",
        template_variables: {
          invoiceNumber: invoice.invoiceNumber,
          amount: formattedAmount,
          paymentDate: new Date().toLocaleDateString(),
          businessName: invoice.fromName,
          businessEmail: invoice.fromEmail,
          receiptLink: `${process.env.NEXT_PUBLIC_APP_URL}/invoice/${invoice.id}/receipt`,
          receiptUrl: (session as any).payment_intent?.charges?.data?.[0]?.receipt_url || '',
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
}
