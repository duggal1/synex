import { notFound } from "next/navigation";
import prisma from "@/app/utils/db";
import { formatCurrency } from "@/app/utils/formatCurrency";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Clock, Calendar, User, Mail, MapPin, Briefcase } from "lucide-react";
import { createStripeCheckoutSession } from "@/app/actions/stripe";
import type { CurrencyType } from "@/app/types/currency";


export default async function InvoicePage({ params }: { params: { id: string }; searchParams: { [key: string]: string | string[] | undefined } }) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      User: {
        select: {
          stripeSettings: {
            select: {
              isConnected: true
            }
          }
        },
      },
    },
  });

  if (!invoice) {
    notFound();
  }

  // Format dates for display
  const invoiceDate = new Date(invoice.date);
  const formattedInvoiceDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
  }).format(invoiceDate);

  const dueDateTimestamp = invoice.dueDate * 1000; // Convert seconds to milliseconds
  const dueDate = new Date(dueDateTimestamp);
  const formattedDueDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
  }).format(dueDate);

  const isPaid = invoice.status === "PAID";
  const isOverdue = !isPaid && dueDate < new Date();

  // Check if the user has Stripe connected
  const hasStripe = Boolean(invoice.User?.stripeSettings?.isConnected);
  const canPayOnline = !isPaid && hasStripe && invoice.paymentLink;

  // Handle nullable fields with default values
  const currency = (invoice.currency || "USD") as CurrencyType;
  const invoiceNote = invoice.note || "";
  const fromName = invoice.fromName || "Sender";

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#030303] p-4 md:p-8">
      <div className="w-full max-w-4xl">
        <Card className="bg-black border border-zinc-800/30 shadow-2xl rounded-2xl overflow-hidden relative backdrop-blur-xl">
          {/* Gradient effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-blue-500/5"></div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent"></div>
          
          {/* Header */}
          <CardHeader className="pb-6 pt-12 px-8 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle className="font-bold text-3xl text-white tracking-tight">
                  {invoice.invoiceName}
                </CardTitle>
                <CardDescription className="text-zinc-400 mt-2 text-sm">
                  Invoice #{invoice.invoiceNumber}
                </CardDescription>
              </div>
              <div>
                {isPaid ? (
                  <div className="flex items-center gap-2 bg-zinc-900/50 backdrop-blur-sm px-5 py-2.5 rounded-full text-emerald-400 border border-emerald-900/50 shadow-lg">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-medium text-sm">Paid</span>
                  </div>
                ) : isOverdue ? (
                  <div className="flex items-center gap-2 bg-zinc-900/50 backdrop-blur-sm px-5 py-2.5 rounded-full text-rose-400 border border-rose-900/50 shadow-lg">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium text-sm">Overdue</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-zinc-900/50 backdrop-blur-sm px-5 py-2.5 rounded-full text-amber-400 border border-amber-900/50 shadow-lg">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium text-sm">Pending</span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          
          {/* Content */}
          <CardContent className="space-y-8 px-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 p-6 rounded-xl bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/50 shadow-lg">
                <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
                  <User className="w-4 h-4 text-blue-400" />
                  <h3 className="font-medium uppercase tracking-wider text-xs">From</h3>
                </div>
                <p className="text-white font-medium text-lg">{fromName}</p>
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <p>{invoice.fromEmail}</p>
                </div>
                <div className="flex items-start gap-2 text-zinc-400 text-sm">
                  <MapPin className="w-4 h-4 text-blue-400 mt-0.5" />
                  <p className="whitespace-pre-line">{invoice.fromAddress}</p>
                </div>
              </div>
              
              <div className="space-y-3 p-6 rounded-xl bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/50 shadow-lg">
                <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
                  <Briefcase className="w-4 h-4 text-violet-400" />
                  <h3 className="font-medium uppercase tracking-wider text-xs">To</h3>
                </div>
                <p className="text-white font-medium text-lg">{invoice.clientName}</p>
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <Mail className="w-4 h-4 text-violet-400" />
                  <p>{invoice.clientEmail}</p>
                </div>
                <div className="flex items-start gap-2 text-zinc-400 text-sm">
                  <MapPin className="w-4 h-4 text-violet-400 mt-0.5" />
                  <p className="whitespace-pre-line">{invoice.clientAddress}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/50 shadow-lg">
                <div className="flex items-center gap-2 text-zinc-400 text-sm mb-3">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-medium uppercase tracking-wider text-xs">Invoice Date</h3>
                </div>
                <p className="text-white text-lg">{formattedInvoiceDate}</p>
              </div>
              
              <div className="p-6 rounded-xl bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/50 shadow-lg">
                <div className="flex items-center gap-2 text-zinc-400 text-sm mb-3">
                  <Calendar className="w-4 h-4 text-rose-400" />
                  <h3 className="font-medium uppercase tracking-wider text-xs">Due Date</h3>
                </div>
                <p className="text-white text-lg">{formattedDueDate}</p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-zinc-900/30 backdrop-blur-xl border border-zinc-800/30 shadow-2xl p-6">
              <div className="gap-4 grid grid-cols-12 mb-4 uppercase tracking-wider font-medium text-zinc-500 text-xs pb-3 border-b border-zinc-800/70">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-right">Quantity</div>
                <div className="col-span-2 text-right">Rate</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>

              <div className="gap-4 grid grid-cols-12 py-5 border-zinc-800/70 border-b">
                <div className="col-span-6 text-white font-medium">{invoice.invoiceItemDescription}</div>
                <div className="col-span-2 text-right text-white">{invoice.invoiceItemQuantity}</div>
                <div className="col-span-2 text-right text-white">
                  {formatCurrency({
                    amount: invoice.invoiceItemRate,
                    currency: currency,
                  })}
                </div>
                <div className="col-span-2 text-right text-white font-medium">
                  {formatCurrency({
                    amount: invoice.invoiceItemQuantity * invoice.invoiceItemRate,
                    currency: currency,
                  })}
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <div className="w-full md:w-1/3">
                  <div className="flex justify-between py-2">
                    <span className="text-zinc-400 font-medium">Subtotal</span>
                    <span className="text-white">
                      {formatCurrency({
                        amount: invoice.total,
                        currency: currency,
                      })}
                    </span>
                  </div>
                  <Separator className="bg-zinc-800/70 my-4" />
                  <div className="flex justify-between py-2 font-medium">
                    <span className="text-zinc-300 uppercase tracking-wider text-sm">Total</span>
                    <span className="text-white text-xl bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
                      {formatCurrency({
                        amount: invoice.total,
                        currency: currency,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {invoice.note && (
              <div className="p-6 rounded-xl bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/50 shadow-lg">
                <h3 className="flex items-center gap-2 text-zinc-400 text-xs mb-4 font-medium uppercase tracking-wider">Notes</h3>
                <p className="text-zinc-300 text-sm whitespace-pre-line leading-relaxed">{invoiceNote}</p>
              </div>
            )}
          </CardContent>
          
          {/* Footer */}
          <CardFooter className="pt-4 pb-12 px-8 relative z-10">
            <div className="w-full">
              {canPayOnline && invoice.paymentLink && (
                <Button 
                  onClick={() => window.location.href = invoice.paymentLink!}
                  className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white rounded-xl py-7 text-base font-medium transition-all duration-200 shadow-lg shadow-violet-900/20"
                >
                  Pay Now
                </Button>
              )}
              {isPaid && (
                <div className="font-medium text-emerald-400 text-center p-5 rounded-xl bg-zinc-900/30 backdrop-blur-sm border border-emerald-900/50 shadow-lg">
                  This invoice has been paid. Thank you!
                </div>
              )}
              {!isPaid && !hasStripe && (
                <div className="font-medium text-amber-400 text-center p-5 rounded-xl bg-zinc-900/30 backdrop-blur-sm border border-amber-900/50 shadow-lg">
                  Please contact {fromName} to arrange payment.
                </div>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}