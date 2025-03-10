import prisma from "@/app/utils/db";
import { requireUser } from "@/app/utils/hooks";
import { emailClient } from "@/app/utils/mailtrap";
import { NextResponse } from "next/server";
import { formatCurrency } from "@/app/utils/formatCurrency";

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const session = await requireUser();
    const { id } = await params;

    const invoiceData = await prisma.invoice.findUnique({
      where: {
        id: id,
        userId: session.user?.id,
      },
    });

    if (!invoiceData) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Don't send reminder if already paid
    if (invoiceData.status === "PAID") {
      return NextResponse.json(
        { error: "Invoice is already paid" },
        { status: 400 }
      );
    }

    const sender = {
      email: "hello@synthicai.com",
      name: "Duggal",
    };

    const formattedAmount = formatCurrency({
      amount: invoiceData.total,
      currency: invoiceData.currency as any,
    });

    const dueDate = new Date(invoiceData.date);
    dueDate.setDate(dueDate.getDate() + invoiceData.dueDate);

    await emailClient.send({
      from: sender,
      to: [{ email: invoiceData.clientEmail }],
      template_uuid: "facd5565-54b5-48c7-a71e-51002283d4f3",
      template_variables: {
        first_name: invoiceData.clientName,
        company_info_name: invoiceData.fromName,
        company_info_address: invoiceData.fromAddress,
        invoice_number: `#${invoiceData.invoiceNumber}`,
        invoice_amount: formattedAmount,
        due_date: dueDate.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending reminder:", error);
    return NextResponse.json(
      { error: "Failed to send Email reminder" },
      { status: 500 }
    );
  }
} 