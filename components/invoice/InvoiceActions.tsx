'use client'

import { Button } from "@/components/ui/button";
import { Mail, ExternalLink } from "lucide-react";

interface InvoiceActionsProps {
  isPaid: boolean;
  hasStripe: boolean;
  paymentLink?: string | null;
  mailtoLink: string;
  fromName: string;
  fromEmail: string;
}

export function InvoiceActions({ isPaid, hasStripe, paymentLink, mailtoLink, fromName, fromEmail }: InvoiceActionsProps) {
  const handleMailTo = () => window.open(mailtoLink, '_blank');
  const handlePayment = () => paymentLink && (window.location.href = paymentLink);

  return (
    <div className="w-full">
      <div className="space-y-4">
        {!isPaid && hasStripe && paymentLink && (
          <Button 
            onClick={handlePayment}
            className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white rounded-xl py-7 text-base font-medium transition-all duration-200 shadow-lg shadow-violet-900/20"
          >
            Pay Now
          </Button>
        )}
        {isPaid && (
          <div className="font-medium text-emerald-400 text-center p-5 rounded-xl bg-black/40 backdrop-blur-sm border border-emerald-900/50 shadow-lg">
            This invoice has been paid. Thank you!
          </div>
        )}
        {!isPaid && !hasStripe && (
          <div className="space-y-4">
            <div className="font-medium text-amber-400 text-center p-5 rounded-xl bg-black/40 backdrop-blur-sm border border-amber-900/50 shadow-lg">
              Please contact {fromName} to arrange payment.
            </div>
            <Button
              variant="outline"
              onClick={handleMailTo}
              className="w-full border-zinc-800 hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
            >
              <Mail className="w-4 h-4 mr-2" />
              Contact About Payment
            </Button>
          </div>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-zinc-800/50">
        <p className="text-zinc-500 text-sm text-center">
          Questions? Contact {fromName} at{' '}
          <a 
            href={mailtoLink}
            className="text-violet-400 hover:text-violet-300 inline-flex items-center"
          >
            {fromEmail}
            <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </p>
      </div>
    </div>
  );
}
