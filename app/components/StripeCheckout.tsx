"use client";
import { useEffect, useState } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

type PaymentStatusType = "processing" | "success" | "failed" | null;
interface PaymentStatus {
  status: PaymentStatusType;
  message: string;
}

interface StripeCheckoutProps {
  clientSecret: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const StatusMessage = ({ status, message }: { status: PaymentStatusType; message: string }) => {
  if (!status) return null;
  
  const config = {
    processing: {
      style: "bg-blue-500/5 border-blue-500/20 text-blue-400",
      Icon: Loader2,
      animate: true
    },
    success: {
      style: "bg-green-500/5 border-green-500/20 text-green-400",
      Icon: CheckCircle2,
      animate: false
    },
    failed: {
      style: "bg-red-500/5 border-red-500/20 text-red-400",
      Icon: XCircle,
      animate: false
    }
  };
  
  const currentConfig = status ? config[status] : null;
  if (!currentConfig) return null;
  
  const { style, Icon, animate } = currentConfig;
  
  return (
    <div className={`my-4 p-3 border rounded-xl flex items-center gap-3 ${style}`}>
      <Icon className={`w-5 h-5 ${animate ? 'animate-spin' : ''}`} />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

export default function StripeCheckout({ clientSecret, onSuccess, onCancel }: StripeCheckoutProps) {
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
    status: null,
    message: ''
  });

  useEffect(() => {
    if (clientSecret) setLoading(false);
  }, [clientSecret]);

  // Handle errors from Stripe embedded checkout
  const handleEmbeddedCheckoutError = () => {
    setPaymentStatus({
      status: 'failed',
      message: 'Payment failed. Please try again.'
    });
  };

  // Properly monitor iframe events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'stripe-embedded-checkout:error') {
        handleEmbeddedCheckoutError();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 h-72 w-full bg-zinc-900 rounded-xl">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-zinc-300 animate-spin" />
          <p className="text-zinc-400 text-sm">Preparing checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md z-50 overflow-y-auto">
      <div className="relative w-full max-w-3xl mx-auto my-8">
        <div className="bg-zinc-900/95 shadow-2xl rounded-2xl overflow-hidden border border-zinc-800/30 backdrop-blur-md">
          <div className="p-4 border-b border-zinc-800/30 flex justify-between items-center">
            <h2 className="text-lg font-medium text-white tracking-tight">Complete Payment</h2>
            <button 
              onClick={onCancel} 
              className="text-zinc-400 hover:text-white transition-colors p-1 rounded-full hover:bg-zinc-800/50"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          <div className="px-4 py-3 overflow-y-auto max-h-[75vh]">
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{
                clientSecret,
                onComplete: () => {
                  setPaymentStatus({
                    status: 'success',
                    message: 'Payment successful! Redirecting...'
                  });
                  if (onSuccess) {
                    setTimeout(onSuccess, 1500);
                  }
                }
              }}
            >
              <EmbeddedCheckout className="w-full" />
            </EmbeddedCheckoutProvider>
          </div>
          <div className="px-4 pb-4">
            <StatusMessage
              status={paymentStatus.status}
              message={paymentStatus.message}
            />
          </div>
        </div>
      </div>
      <style jsx global>{`
        .StripeCheckout {
          width: 100%;
          height: 550px;
          overflow-y: auto;
        }
        .StripeCheckout iframe {
          border-radius: 12px;
          min-height: 550px;
          width: 100%;
          box-shadow: 0 8px 40px rgba(0, 0, 0, 0.25);
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          overflow: auto !important;
        }
      `}</style>
    </div>
  );
}