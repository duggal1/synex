"use server";

import { requireUser } from "./utils/hooks";
import { parseWithZod } from "@conform-to/zod";
import { invoiceSchema, onboardingSchema } from "./utils/zodSchemas";
import prisma from "./utils/db";
import { redirect } from "next/navigation";
import { emailClient } from "./utils/mailtrap";
import { formatCurrency } from "./utils/formatCurrency";
import Stripe from "stripe";
import { CurrencyType } from "./types/currency";

export async function onboardUser(prevState: any, formData: FormData) {
  const session = await requireUser();

  const submission = parseWithZod(formData, { schema: onboardingSchema });
  if (submission.status !== "success") {
    return submission.reply();
  }

  await prisma.user.update({
    where: { id: session.user?.id },
    data: {
      firstName: submission.value.firstName,
      lastName: submission.value.lastName,
      address: submission.value.address,
    },
  });

  return redirect("/dashboard");
}

export async function createInvoice(prevState: any, formData: FormData) {
  const session = await requireUser();

  const submission = parseWithZod(formData, { schema: invoiceSchema });
  if (submission.status !== "success") {
    return submission.reply();
  }

  // Convert invoice date string to a Date object.
  const invoiceDateObj = new Date(submission.value.date);
  if (isNaN(invoiceDateObj.getTime())) {
    throw new Error("Invalid invoice date");
  }

  // Get dueDays from the select (e.g. "0", "15", "30") and convert to number.
  const dueDays = Number(submission.value.dueDate);
  if (isNaN(dueDays)) {
    throw new Error("Invalid due date value");
  }
  // Compute due date based on the invoice date plus dueDays.
  const dueDateObj = new Date(invoiceDateObj.getTime() + dueDays * 24 * 60 * 60 * 1000);
  // Convert dueDate to seconds (if your Prisma model stores it as an INT)
  const dueDateNumber = Math.floor(dueDateObj.getTime() / 1000);
  const now = new Date();

  // Determine initial status - only set as OVERDUE if the due date has already passed
  const initialStatus = dueDateObj < now ? "OVERDUE" : "PENDING";

  // Compute total if not provided (fallback to quantity * rate)
  const computedTotal =
    submission.value.total ||
    submission.value.invoiceItemQuantity * submission.value.invoiceItemRate;

  // Handle nullable fields with default values
  const note = submission.value.note || "";
  const currency = (submission.value.currency || "USD") as CurrencyType;

  const data = await prisma.invoice.create({
    data: {
      clientAddress: submission.value.clientAddress,
      clientEmail: submission.value.clientEmail,
      clientName: submission.value.clientName,
      currency,
      date: submission.value.date, // storing invoice date as a string (or Date, as per your model)
      dueDate: dueDateNumber,       // storing due date as seconds (number)
      fromAddress: submission.value.fromAddress,
      fromEmail: submission.value.fromEmail,
      fromName: submission.value.fromName,
      invoiceItemDescription: submission.value.invoiceItemDescription,
      invoiceItemQuantity: submission.value.invoiceItemQuantity,
      invoiceItemRate: submission.value.invoiceItemRate,
      invoiceName: submission.value.invoiceName,
      invoiceNumber: submission.value.invoiceNumber,
      status: initialStatus,
      total: computedTotal,
      note,
      userId: session.user?.id,
    },
  });

  // Check if user has Stripe enabled and get their settings
  const userStripeSettings = await prisma.stripeSettings.findUnique({
    where: { userId: session.user?.id },
    select: {
      isConnected: true,
      stripeSecretKey: true,
    },
  });

  let paymentLink = null;
  let hasOnlinePayment = false;

  if (userStripeSettings?.isConnected && userStripeSettings.stripeSecretKey) {
    try {
      const stripe = new Stripe(userStripeSettings.stripeSecretKey, {
        apiVersion: "2025-02-24.acacia"  
      });

      const paymentSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: submission.value.invoiceName,
              description: `Invoice #${submission.value.invoiceNumber}`
            },
            unit_amount: computedTotal * 100
          },
          quantity: 1
        }],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoice/view/${data.id}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoice/view/${data.id}`,
      });

      paymentLink = paymentSession.url;
      hasOnlinePayment = true;

      // Update invoice with payment info
      await prisma.invoice.update({
        where: { id: data.id },
        data: {
          paymentLink: paymentSession.url || '',
          stripeCheckoutSessionId: paymentSession.id || '',
          paymentMethod: "STRIPE"
        }
      });
    } catch (error) {
      console.error("Stripe payment setup failed:", error);
      // Log the specific error for debugging
      console.error("Error details:", {
        userId: session.user?.id,
        invoiceId: data.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Format dates for email display.
  const formattedInvoiceDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
  }).format(invoiceDateObj);
  const formattedDueDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
  }).format(dueDateObj);

  const sender = {
    email: "hello@synthicai.com",
    name: "duggal",
  };

  // Create initial payment state
  const initialPaymentState = {
    isPaid: false,
    isOverdue: dueDateObj < now,
    hasOnlinePayment,
  };

  emailClient.send({
    from: sender,
    to: [{ email: submission.value.clientEmail }],
    template_uuid: "bd360be3-3027-41f1-a3c9-736efc8455db",
    template_variables: {
      invoiceName: submission.value.invoiceName,
      invoiceNumber: submission.value.invoiceNumber,
      formattedDate: formattedInvoiceDate,          // matches the template placeholder
      formattedDueDate: formattedDueDate,             // matches the template placeholder
      status: submission.value.status,
      fromName: submission.value.fromName,
      fromEmail: submission.value.fromEmail,
      fromAddress: submission.value.fromAddress,
      clientName: submission.value.clientName,
      clientEmail: submission.value.clientEmail,
      clientAddress: submission.value.clientAddress,
      invoiceItemDescription: submission.value.invoiceItemDescription,
      invoiceItemQuantity: submission.value.invoiceItemQuantity,
      formattedRate: formatCurrency({
        amount: submission.value.invoiceItemRate,
        currency: submission.value.currency,
      }),
      formattedItemTotal: formatCurrency({
        amount: submission.value.invoiceItemQuantity * submission.value.invoiceItemRate,
        currency: submission.value.currency,
      }),
      formattedTotal: formatCurrency({
        amount: computedTotal,
        currency: submission.value.currency,
      }),
      note,
      invoiceLink:
        process.env.NODE_ENV !== "production"
          ? `http://localhost:3000/invoice/view/${data.id}`
          : `https://synexai.in/invoice/view/${data.id}`,
      hasOnlinePayment,
      paymentLink: paymentLink || '',
      payNowText: paymentLink ? "Pay Now via Credit Card" : "",
      stripeEnabled: userStripeSettings?.isConnected || false,
      showPayButton: Boolean(paymentLink),
      isPaid: false,
      isOverdue: dueDateObj < new Date(),
      statusClass: initialPaymentState.isPaid 
        ? "paid" 
        : new Date(dueDateObj) < new Date() 
        ? "overdue" 
        : "pending",
      daysRemaining: Math.ceil((dueDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      gracePeriod: dueDays,
      // Use single paymentMethod property
      paymentMethod: userStripeSettings?.isConnected 
        ? "Online payment available via credit card" 
        : "Contact for payment details",
      urgencyLevel: dueDateObj < now 
        ? "overdue" 
        : dueDateObj.getTime() - now.getTime() < 48 * 60 * 60 * 1000 
        ? "urgent"
        : "normal",
    },
  });
    
  return redirect("/dashboard/invoices");
}

export async function editInvoice(prevState: any, formData: FormData) {
  const session = await requireUser();

  const submission = parseWithZod(formData, { schema: invoiceSchema });
  if (submission.status !== "success") {
    return submission.reply();
  }

  const invoiceId = formData.get("id") as string;

  const invoiceDateObj = new Date(submission.value.date);
  if (isNaN(invoiceDateObj.getTime())) {
    throw new Error("Invalid invoice date");
  }
  const dueDays = Number(submission.value.dueDate);
  if (isNaN(dueDays)) {
    throw new Error("Invalid due date value");
  }
  const dueDateObj = new Date(invoiceDateObj.getTime() + dueDays * 24 * 60 * 60 * 1000);
  const dueDateNumber = Math.floor(dueDateObj.getTime() / 1000);

  const computedTotal =
    submission.value.total ||
    submission.value.invoiceItemQuantity * submission.value.invoiceItemRate;

  const data = await prisma.invoice.update({
    where: { id: invoiceId, userId: session.user?.id },
    data: {
      clientAddress: submission.value.clientAddress,
      clientEmail: submission.value.clientEmail,
      clientName: submission.value.clientName,
      currency: submission.value.currency,
      date: submission.value.date,
      dueDate: dueDateNumber,
      fromAddress: submission.value.fromAddress,
      fromEmail: submission.value.fromEmail,
      fromName: submission.value.fromName,
      invoiceItemDescription: submission.value.invoiceItemDescription,
      invoiceItemQuantity: submission.value.invoiceItemQuantity,
      invoiceItemRate: submission.value.invoiceItemRate,
      invoiceName: submission.value.invoiceName,
      invoiceNumber: submission.value.invoiceNumber,
      status: submission.value.status,
      total: computedTotal,
      note: submission.value.note,
    },
  });

  const formattedInvoiceDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
  }).format(invoiceDateObj);
  const formattedDueDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
  }).format(dueDateObj);

  const sender = {
    email: "hello@synthicai.com",
    name: "duggal",
  };

  emailClient.send({
    from: sender,
    to: [{ email: submission.value.clientEmail }],
    template_uuid: "bd360be3-3027-41f1-a3c9-736efc8455db",
    template_variables: {
      invoiceName: submission.value.invoiceName,
      invoiceNumber: submission.value.invoiceNumber,
      invoiceDate: formattedInvoiceDate,
      invoiceDueDate: formattedDueDate,
      status: submission.value.status,
      fromName: submission.value.fromName,
      fromEmail: submission.value.fromEmail,
      fromAddress: submission.value.fromAddress,
      clientName: submission.value.clientName,
      clientEmail: submission.value.clientEmail,
      clientAddress: submission.value.clientAddress,
      invoiceItemDescription: submission.value.invoiceItemDescription,
      invoiceItemQuantity: submission.value.invoiceItemQuantity,
      invoiceItemRate: formatCurrency({
        amount: submission.value.invoiceItemRate,
        currency: submission.value.currency,
      }),
      itemTotal: formatCurrency({
        amount: submission.value.invoiceItemQuantity * submission.value.invoiceItemRate,
        currency: submission.value.currency,
      }),
      subtotal: formatCurrency({
        amount: computedTotal,
        currency: submission.value.currency,
      }),
      total: formatCurrency({
        amount: computedTotal,
        currency: submission.value.currency,
      }),
      note: submission.value.note ?? "",
      invoiceLink:
        process.env.NODE_ENV !== "production"
          ? `http://localhost:3000/api/invoice/${data.id}`
          : `https://invoice-marshal.vercel.app/api/invoice/${data.id}`,
      isPaid: data.status === "PAID",
      isOverdue: data.status !== "PAID" && new Date(dueDateObj) < new Date(),
      statusClass: data.status === "PAID" 
        ? "paid" 
        : new Date(dueDateObj) < new Date() 
        ? "overdue" 
        : "pending"
    },
  });

  return redirect("/dashboard/invoices");
}

export async function DeleteInvoice(invoiceId: string) {
  const session = await requireUser();

  await prisma.invoice.delete({
    where: { userId: session.user?.id, id: invoiceId },
  });

  return redirect("/dashboard/invoices");
}

export async function MarkAsPaidAction(invoiceId: string) {
  const session = await requireUser();

  await prisma.invoice.update({
    where: { userId: session.user?.id, id: invoiceId },
    data: { status: "PAID" },
  });

  return redirect("/dashboard/invoices");
}