


//api/invoices/payment/route.ts




import { NextRequest, NextResponse } from "next/server";
import { initializeStripe } from "@/app/utils/stripe";
import prisma from "@/app/utils/db";

export async function GET(req: NextRequest) {
  try {
    const invoiceId = req.nextUrl.searchParams.get('invoiceId');
    
    if (!invoiceId) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        User: true, // Capitalize 'User' to match Prisma schema
      },
    });

    if (!invoice || !invoice.userId) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const stripe = await initializeStripe(invoice.userId);
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Invoice #${invoice.invoiceNumber}`,
            },
            unit_amount: Math.round(invoice.total * 100), // Use 'total' instead of 'amount'
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoiceId}?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoiceId}?canceled=true`,
      metadata: {
        invoiceId,
        userId: invoice.userId,
      },
    });

    if (!session.url) {
      throw new Error("No checkout URL returned from Stripe");
    }

    return NextResponse.redirect(session.url);
  } catch (error) {
    console.error("Payment initiation error:", error);
    return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { invoiceId } = await req.json();

    if (!invoiceId) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        User: true, // Capitalize 'User' to match Prisma schema
      },
    });

    if (!invoice || !invoice.userId) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const stripe = await initializeStripe(invoice.userId);
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Invoice #${invoice.invoiceNumber}`,
            },
            unit_amount: Math.round(invoice.total * 100), // Use 'total' instead of 'amount'
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoiceId}?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoiceId}?canceled=true`,
      metadata: {
        invoiceId,
        userId: invoice.userId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Payment initiation error:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment" },
      { status: 500 }
    );
  }
}
