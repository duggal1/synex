import Stripe from "stripe";
import prisma from "./db";

export async function initializeStripe(userId: string): Promise<Stripe | null> {
  try {
    const stripeSettings = await prisma.stripeSettings.findUnique({
      where: { userId },
      select: {
        stripeSecretKey: true,
        isConnected: true,
      },
    });

    if (!stripeSettings?.isConnected || !stripeSettings.stripeSecretKey) {
      console.error("Stripe not configured for user:", userId);
      return null;
    }

    return new Stripe(stripeSettings.stripeSecretKey, {
      apiVersion: "2025-02-24.acacia", // Update to latest stable version
      typescript: true,
    });
  } catch (error) {
    console.error("Failed to initialize Stripe:", error);
    return null;
  }
}

export async function createInvoicePayment(invoiceId: string) {
  try {
    const response = await fetch('/api/invoices/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invoiceId }),
    });

    const data = await response.json();
    
    if (data.url) {
      window.location.href = data.url;
      return { success: true };
    } else {
      throw new Error(data.error || 'Failed to initialize payment');
    }
  } catch (error) {
    console.error('Payment initialization error:', error);
    return { success: false, error: 'Failed to initialize payment' };
  }
}
