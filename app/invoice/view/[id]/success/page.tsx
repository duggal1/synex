import { notFound, redirect } from "next/navigation";
import prisma from "@/app/utils/db";
import { CheckCircle } from "lucide-react";
import { formatCurrency } from "@/app/utils/formatCurrency";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function PaymentSuccessPage({ 
  params, 
  searchParams 
}: { 
  params: { id: string },
  searchParams: { session_id?: string }
}) {
  const { id } = params;
  const { session_id } = searchParams;

  // If no session ID is provided, redirect to the invoice page
  if (!session_id) {
    redirect(`/invoice/view/${id}`);
  }

  // Get the invoice details
  const invoice = await prisma.invoice.findUnique({
    where: { id },
  });

  if (!invoice) {
    notFound();
  }

  // If the invoice is not paid yet, update it
  if (invoice.status !== "PAID") {
    await prisma.invoice.update({
      where: { id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        stripeCheckoutSessionId: session_id,
        paymentMethod: "STRIPE",
      },
    });
  }

  return (
    <div className="flex flex-col justify-center items-center bg-gradient-to-b from-gray-900 to-black p-4 min-h-screen text-white">
      <div className="w-full max-w-md">
        <Card className="bg-black/40 backdrop-blur-sm border-neutral-800/50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-emerald-500/20 p-4 rounded-full">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
              </div>
            </div>
            <CardTitle className="font-bold text-2xl">Payment Successful!</CardTitle>
            <CardDescription className="text-neutral-400">
              Thank you for your payment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Invoice</span>
                <span className="font-medium">{invoice.invoiceName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Invoice #</span>
                <span className="font-medium">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Amount Paid</span>
                <span className="font-medium">
                  {formatCurrency({
                    amount: invoice.total,
                    currency: invoice.currency,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Payment Date</span>
                <span className="font-medium">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="pt-4">
              <Button 
                asChild
                className="bg-gradient-to-r from-violet-600 hover:from-violet-700 to-indigo-600 hover:to-indigo-700 w-full"
              >
                <Link href={`/invoice/view/${id}`}>
                  View Invoice
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 