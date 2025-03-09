import prisma from "@/app/utils/db";
import { requireUser } from "@/app/utils/hooks";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ invoiceId: string }>;
  }
) {
  try {
    const session = await requireUser();
    const { invoiceId } = await params;

    // Verify invoice belongs to user and exists
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
        userId: session.user?.id,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Update invoice status and set paidAt to current date
    const updatedInvoice = await prisma.invoice.update({
      where: {
        id: invoiceId,
      },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    });

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
} 