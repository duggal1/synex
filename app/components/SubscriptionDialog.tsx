"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowRight, Check, Sparkles, ZapIcon } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import Link from "next/link";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  freeInvoicesLeft: number;
}

export function SubscriptionDialog({ isOpen, onClose, freeInvoicesLeft }: Props) {
  const router = useRouter();
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-black border border-neutral-800 rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-medium text-white">
            Upgrade Now
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-6">
          {/* Usage Alert */}
          <div className="bg-blue-950/20 p-3 rounded-md border border-blue-900/50">
            <p className="text-sm text-blue-100">
              {freeInvoicesLeft === 0
                ? "You've reached your free invoice limit (5 invoices)."
                : `You have ${freeInvoicesLeft} free invoice${freeInvoicesLeft !== 1 ? 's' : ''} remaining.`
              }
            </p>
          </div>
          
          {/* Features Grid */}
          <div className="grid gap-3">
            {[
              "Unlimited Invoices",
              "Premium Templates",
              "Advanced Analytics",
              "AI-Powered Insights",
              "Priority Support",
              "Custom Branding"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-neutral-300">{feature}</span>
              </div>
            ))}
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-2">
          <Link href={"/dashboard/upgrade"}>

      <GradientButton className=" mt-6" >
        <ZapIcon className="text-neutral-200">
          </ZapIcon>
          Upgrade Now</GradientButton>
     </Link>
            
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-300"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}