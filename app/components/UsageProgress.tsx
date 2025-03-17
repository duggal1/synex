"use client";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Sparkles, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { GradientButton } from "@/components/ui/gradient-button";

const MAX_FREE_INVOICES = 5;

export interface UsageProgressProps {
  invoiceCount: number;
  isSubscribed: boolean;
}

export function UsageProgress({
  invoiceCount: initialInvoiceCount,
  isSubscribed
}: UsageProgressProps) {
  const router = useRouter();
  const [invoiceCount, setInvoiceCount] = useState(initialInvoiceCount);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Real-time usage updates
  useEffect(() => {
    if (isSubscribed) return; // Early return for subscribed users

    const fetchUsage = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/usage-stats', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!res.ok) throw new Error('Failed to fetch usage');
        
        const data = await res.json();
        setInvoiceCount(data.invoiceCount);
      } catch (error) {
        console.error('Error fetching usage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchUsage();
    
    // Set up polling every 2 seconds
    const interval = setInterval(fetchUsage, 2000);
    
    // Cleanup
    return () => clearInterval(interval);
  }, [isSubscribed]);

  // Don't render anything if user is subscribed
  if (isSubscribed) return null;

  const invoiceProgress = (invoiceCount / MAX_FREE_INVOICES) * 100;
  const remainingInvoices = MAX_FREE_INVOICES - invoiceCount;
  const isLowOnInvoices = invoiceProgress > 60;
  const isCriticallyLow = invoiceProgress > 80;

  const handleUpgrade = () => {
    setIsLoading(true);
    router.push("/dashboard/upgrade");
  };

  return (
    <div className="bg-black/5 backdrop-blur-lg rounded-xl border border-white/10 space-y-5 p-6 shadow-xl transition-all duration-300 hover:border-white/20">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-300">Free Plan Usage</span>
            {isLowOnInvoices && (
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                isCriticallyLow 
                  ? "bg-red-500/20 text-red-300" 
                  : "bg-amber-500/20 text-amber-300"
              )}>
                {isCriticallyLow ? "Almost Full" : "Running Low"}
              </span>
            )}
          </div>
          <span className={cn(
            "font-medium text-sm",
            isCriticallyLow 
              ? "text-red-400 " 
              : isLowOnInvoices 
                ? "text-amber-400" 
                : "text-neutral-300"
          )}>
            {invoiceCount}/{MAX_FREE_INVOICES}
          </span>
        </div>
        
        <div className="relative">
      <Progress
        value={invoiceProgress}
        className="h-3  backdrop-blur-md rounded-full shadow-inner"
        indicatorClassName={cn(
          "rounded-full bg-gradient-to-r",
          isCriticallyLow
            ? "from-rose-500 via-red-500 to-rose-500 animate-gradient-fast"
            : isLowOnInvoices
            ? "from-amber-400 via-orange-500 to-amber-400 animate-gradient-fast"
            : "from-blue-600 via-pink-600 to-blue-500 animate-gradient-fast"
        )}
      />
    </div>
        
        <div className="text-xs text-neutral-400">
          {remainingInvoices === 0 ? (
            <span className="text-red-400">You&apos;ve used all your free invoices</span>
          ) : remainingInvoices === 1 ? (
            <span className="text-amber-400">Only 1 free invoice remaining</span>
          ) : (
            <span>{remainingInvoices} free invoices remaining</span>
          )}
        </div>
      </div>

      <Link href={"/dashboard/upgrade"}>
      <GradientButton className=" mt-6" >Upgrade Now</GradientButton>
     </Link>
    </div>
  );
}