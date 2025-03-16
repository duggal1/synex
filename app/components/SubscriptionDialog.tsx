"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  freeInvoicesLeft: number;
}

export function SubscriptionDialog({ isOpen, onClose, freeInvoicesLeft }: Props) {
  const router = useRouter();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Upgrade Your Plan</DialogTitle>
          <DialogDescription className="text-lg pt-2">
            {freeInvoicesLeft === 0 
              ? "You've reached your free invoice limit (1 invoice)."
              : `You have ${freeInvoicesLeft} free invoice${freeInvoicesLeft !== 1 ? 's' : ''} remaining.`
            }
          </DialogDescription>
        </DialogHeader>
        <div className="my-4">
          <p className="text-muted-foreground">
            Upgrade to our premium plan to create unlimited invoices and access
            more features.
          </p>
          <ul className="mt-4 space-y-2">
            <li className="flex items-center gap-2">
              ✓ Unlimited Invoices
            </li>
            <li className="flex items-center gap-2">
              ✓ Premium Templates
            </li>
            <li className="flex items-center gap-2">
              ✓ Advanced Analytics
            </li>
          </ul>
        </div>
        <DialogFooter className="flex gap-2 sm:justify-start">
          <Button
            variant="default"
            className="flex-1"
            onClick={() => router.push("/dashboard/upgrade")}
          >
            Upgrade Now
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
