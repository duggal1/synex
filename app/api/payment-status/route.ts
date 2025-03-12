import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/app/utils/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });

    if (!session.metadata) {
      return NextResponse.json({ error: "No metadata found" }, { status: 404 });
    }

    // Format the amount with currency
    const amount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: session.metadata.currency || 'USD',
    }).format(Number(session.metadata.amount));

    return NextResponse.json({
      amount,
      invoiceNumber: session.metadata.invoiceNumber,
      fromEmail: session.metadata.fromEmail,
      fromName: session.metadata.fromName,
      status: session.status,
      paymentStatus: session.payment_status,
    });
  } catch (error) {
    console.error("Error fetching payment status:", error);
    return NextResponse.json({ error: "Failed to fetch payment status" }, { status: 500 });
  }
} 