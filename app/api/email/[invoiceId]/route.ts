import prisma from "@/app/utils/db";
import { requireUser } from "@/app/utils/hooks";
import { emailClient } from "@/app/utils/mailtrap";
import { NextResponse } from "next/server";

export async function POST(
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

    const invoiceData = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
        userId: session.user?.id,
      },
    });

    if (!invoiceData) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const sender = {
      email: "hello@synthicai.com ",
      name: "Duggal",
    };

    emailClient.send({
      from: sender,
      to: [{ email: invoiceData.clientEmail }], // Use the client's email from invoice data
      template_uuid: "bd360be3-3027-41f1-a3c9-736efc8455db",
      template_variables: {
        first_name: invoiceData.clientName,
        company_info_name: invoiceData.fromName,
        company_info_address: invoiceData.fromAddress,
        company_info_city: "", // You might want to add these fields to your invoice schema
        company_info_zip_code: "",
        company_info_country: "",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to send Email reminder" },
      { status: 500 }
    );
  }
}
