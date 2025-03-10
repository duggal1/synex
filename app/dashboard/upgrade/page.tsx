"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Check, 
  Loader2, 
  Zap, 
  CalendarRange, 
  Sparkles, 
  ArrowRight, 
  Shield, 
  Clock, 
  CheckCircle2 
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { 
  getCurrentSubscription, 
  getCheckoutSession, 
  initializePayment, 
  createCheckoutSession
} from "./actions";
import { PaymentStatus, SubscriptionPlan } from "@prisma/client";
import { Progress } from "@/components/ui/progress";
import StripeCheckout from "@/app/components/StripeCheckout";

interface SubscriptionData {
  planType: SubscriptionPlan | "FREE";
  status: PaymentStatus | "INACTIVE";
  currentPeriodEnd?: Date | null;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: "month" | "year";
  features: string[];
  highlight?: boolean;
  icon: React.ReactNode;
  originalPrice?: number;
}

const calculateAnnualPrice = (monthlyPrice: number) => {
  const annualCost = monthlyPrice * 12;
  const baseDiscount = 0.40; // 40% base discount
  const finalPrice = Math.floor(annualCost * (1 - baseDiscount));
  return {
    originalPrice: annualCost,
    discountedPrice: finalPrice,
    savings: annualCost - finalPrice,
    savingsPercentage: Math.round(baseDiscount * 100)
  };
};

const formatPrice = (price: number) => {
  return `$${price.toFixed(2)}`;
};

const plans: Plan[] = [
  {
    id: "pro_monthly",
    name: "Pro Monthly",
    price: 19.99,
    interval: "month",
    icon: <Zap className="w-5 h-5" />,
    features: [
      "Unlimited invoices",
      "Custom branding",
      "Client payment portal",
      "Email reminders",
      "Analytics dashboard",
      "Priority support",
    ],
  },
  {
    id: "pro_yearly",
    name: "Pro Yearly",
    price: calculateAnnualPrice(19.99).discountedPrice,
    originalPrice: calculateAnnualPrice(19.99).originalPrice,
    interval: "year",
    highlight: true,
    icon: <Sparkles className="w-5 h-5" />,
    features: [
      "All Pro Monthly features",
      `Save ${calculateAnnualPrice(19.99).savingsPercentage}% (${formatPrice(calculateAnnualPrice(19.99).savings)}/year)`,
      "Advanced analytics",
      "Team collaboration",
      "API access",
      "Dedicated account manager",
    ],
  },
];

const SubscriptionStatusCard = ({ subscription }: { subscription: SubscriptionData }) => {
  const isYearly = subscription.planType === "PRO_YEARLY";
  const endDate = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
  const daysRemaining = endDate 
    ? Math.max(0, Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800/50 shadow-xl">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10">
              {isYearly ? <Sparkles className="w-5 h-5 text-indigo-400" /> : <Zap className="w-5 h-5 text-indigo-400" />}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {isYearly ? "Pro Yearly" : "Pro Monthly"} Plan
              </h3>
              <p className="text-sm text-zinc-400">Active Subscription</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            Active
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-800/50">
          <div className="flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-zinc-400" />
            <div>
              <p className="text-sm text-zinc-400">Expires On</p>
              <p className="text-sm font-medium text-white">
                {endDate?.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <div>
              <p className="text-sm text-zinc-400">Time Remaining</p>
              <p className="text-sm font-medium text-white">{daysRemaining} days</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Subscription Progress</span>
            <span className="text-zinc-300">{daysRemaining} days left</span>
          </div>
          <Progress 
            value={Math.max(0, Math.min(100, (daysRemaining / (isYearly ? 365 : 30)) * 100))} 
            className="h-2 bg-zinc-800"
          />
        </div>
      </div>
    </div>
  );
};

const SuccessMessage = () => (
  <div className="mb-8 bg-zinc-900/50 border border-emerald-500/20 rounded-2xl p-6">
    <div className="flex items-center gap-4">
      <div className="flex-shrink-0 bg-emerald-500/20 p-3 rounded-full">
        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">
          Payment Successful!
        </h3>
        <p className="text-zinc-400">
          Your subscription has been activated. You now have access to all premium features.
        </p>
      </div>
    </div>
  </div>
);

export default function UpgradePage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [canceled, setCanceled] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    async function loadSubscription() {
      try {
        const result = await getCurrentSubscription();
        if (result.success) {
          setSubscription(result.data);
        } else {
          toast.error(result.error);
        }
      } catch (error) {
        toast.error("Failed to load subscription data");
      } finally {
        setLoading(false);
      }
    }

    // Check for success or canceled query params
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");
    
    if (sessionId) {
      handleSessionStatus(sessionId);
    } else if (urlParams.get("success") === "true") {
      setSuccess(true);
    } else if (urlParams.get("canceled") === "true") {
      setCanceled(true);
    }

    loadSubscription();
  }, []);

  const handleSessionStatus = async (sessionId: string) => {
    const result = await getCheckoutSession(sessionId);
    if (result.success && result.session) {
      const session = result.session;
      if (session.status === "complete") {
        setSuccess(true);
        // Reload to update subscription status
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        // Remove the session_id from the URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (session.status === "expired") {
        setCanceled(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (subscription?.status === "ACTIVE") {
      toast.error("You already have an active subscription");
      return;
    }
  
    setProcessingPlan(planId);
    try {
      // For modern browsers, use the embedded checkout
      if (window.matchMedia('(min-width: 768px)').matches) {
        const result = await createCheckoutSession(planId);
        if (result.success && result.clientSecret) {
          setClientSecret(result.clientSecret);
          setCheckoutOpen(true);
        } else {
          toast.error(result.error || "Failed to create checkout session");
        }
      } else {
        // Fallback to redirect checkout for mobile
        const result = await initializePayment(planId);
        if (result.success && result.checkoutUrl) {
          window.location.href = result.checkoutUrl;
        } else {
          toast.error(result.error || "Failed to initialize payment");
        }
      }
    } catch (error) {
      toast.error("An error occurred while processing your request");
    } finally {
      setProcessingPlan(null);
    }
  };

  // Show success message
  useEffect(() => {
    if (success) {
      toast.success(
        <div className="flex flex-col gap-1">
          <p className="font-semibold">Subscription Activated!</p>
          <p className="text-sm text-zinc-200">You now have full access to all premium features.</p>
        </div>,
        {
          duration: 5000,
          position: "top-center",
        }
      );
    }
    if (canceled) {
      toast.error(
        <div className="flex flex-col gap-1">
          <p className="font-semibold">Payment Canceled</p>
          <p className="text-sm text-zinc-200">Your subscription status remains unchanged.</p>
        </div>,
        {
          duration: 5000,
          position: "top-center",
        }
      );
    }
  }, [success, canceled]);

  const isSubscribed = subscription?.status === "ACTIVE";
  const isProMonthly = isSubscribed && subscription?.planType === "PRO_MONTHLY";
  const isProYearly = isSubscribed && subscription?.planType === "PRO_YEARLY";

  if (loading) {
    return (
      <div className="min-h-[70vh] flex justify-center items-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-5 h-5 text-indigo-500" />
            </div>
          </div>
          <p className="text-zinc-400 animate-pulse">Loading subscription...</p>
        </div>
      </div>
    );
  }

  // If user has an active subscription, show subscription details
  if (isSubscribed && subscription) {
    const now = new Date();
    const endDate = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
    const totalDays = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const daysRemaining = Math.max(0, totalDays);
    const isYearly = subscription.planType === "PRO_YEARLY";
    const remainingPercentage = Math.floor((daysRemaining / (isYearly ? 365 : 30)) * 100);

    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 bg-zinc-950">
        <div className="max-w-4xl mx-auto">
          {/* Success Animation - If just subscribed */}
          {success && (
            <div className="mb-8 flex justify-center">
              <div className="relative flex flex-col items-center">
                <div className="absolute -inset-12 bg-indigo-600/20 rounded-full blur-3xl opacity-70 animate-pulse"></div>
                <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 mb-6 shadow-xl shadow-indigo-500/20">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Payment Successful!</h2>
                <p className="text-indigo-200 text-lg text-center">
                  Your subscription is now active
                </p>
              </div>
            </div>
          )}

          {/* Subscription Status Card - Modern Dark UI */}
          <div className="relative rounded-3xl overflow-hidden group transition-all duration-500 hover:shadow-2xl">
            {/* Card Background */}
            <div className="absolute inset-0 bg-zinc-900 border border-zinc-700/50 rounded-3xl"></div>
            
            {/* Subtle Glow Accents */}
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-indigo-600 rounded-full blur-3xl opacity-10 animate-pulse-slow"></div>
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-violet-600 rounded-full blur-3xl opacity-10 animate-pulse-slow"></div>
            
            <div className="relative p-8 sm:p-10">
              {/* Active Status Badge */}
              <div className="flex justify-center mb-8">
                <Badge 
                  className="px-4 py-2.5 bg-zinc-800/90 text-indigo-300 border-zinc-700 rounded-full"
                  variant="outline"
                >
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    Active Subscription
                  </div>
                </Badge>
              </div>

              {/* Plan Info */}
              <div className="space-y-8">
                <div className="text-center">
                  <h1 className="text-4xl font-bold tracking-tight text-white">
                    {isYearly ? "Premium Annual" : "Premium Monthly"} Plan
                  </h1>
                  <p className="mt-4 text-zinc-400 font-medium">
                    Your subscription is active until {endDate?.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      label: "Subscription Type",
                      value: isYearly ? "Annual" : "Monthly",
                      icon: <Clock className="w-5 h-5 text-indigo-400" />,
                    },
                    {
                      label: "Days Remaining",
                      value: daysRemaining,
                      icon: <CalendarRange className="w-5 h-5 text-indigo-400" />,
                    },
                    {
                      label: "Status",
                      value: "Active",
                      icon: <Shield className="w-5 h-5 text-indigo-400" />,
                    }
                  ].map((stat, i) => (
                    <div 
                      key={i}
                      className="group relative overflow-hidden rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-4 transition-all duration-300 hover:bg-zinc-800/80"
                    >
                      <div className="relative flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-zinc-700/50">
                          {stat.icon}
                        </div>
                        <div>
                          <p className="text-sm text-zinc-400">{stat.label}</p>
                          <p className="text-xl font-semibold text-white">{stat.value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Progress Bar */}
                <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Subscription Period</span>
                      <span className="text-zinc-300 font-medium">{daysRemaining} days left</span>
                    </div>
                    <div className="relative h-3 bg-zinc-900 rounded-full overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 bg-indigo-500 transition-all duration-500 rounded-full"
                        style={{ width: `${remainingPercentage}%` }}
                      >
                        {/* Add shimmer effect */}
                        <div className="absolute inset-0 w-full h-full">
                          <div className="w-1/3 h-full bg-white/20 skew-x-12 animate-shimmer"></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>Start</span>
                      <span>End</span>
                    </div>
                  </div>
                </div>

                {/* Premium Features Display */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    "Unlimited Invoices", 
                    "Custom Branding", 
                    "Client Portal", 
                    "Analytics Dashboard", 
                    "API Access",
                    "Priority Support"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                      <div className="rounded-full p-1 bg-indigo-500/20 text-indigo-400">
                        <Check className="w-4 h-4" />
                      </div>
                      <span className="text-zinc-300">{feature}</span>
                    </div>
                  ))}
                </div>
                
                {/* Call to Action Button */}
                <div className="flex justify-center pt-4">
                  <Button className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 px-6 rounded-full">
                    Manage Subscription
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show plans for non-subscribed users with dark mode UI
  return (
    <div className="min-h-screen py-12 container bg-zinc-950">
      {/* Show success message if payment was successful */}
      {success && <SuccessMessage />}
      
      <div className="mx-auto mb-12 max-w-lg text-center">
        <div className="inline-block relative mb-4">
          <Badge variant="outline" className="relative py-1.5 px-4 bg-zinc-800 text-indigo-300 border-zinc-700 shadow-lg">
            Upgrade Today
          </Badge>
        </div>
        <h1 className="font-bold text-3xl sm:text-4xl mb-3 tracking-tight text-white">
          Elevate Your Experience
        </h1>
        <p className="mt-2 text-zinc-400 max-w-md mx-auto">
          Choose the perfect plan to unlock premium features and take your workflow to the next level
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-5 h-5 text-indigo-500" />
            </div>
          </div>
        </div>
      ) : (
        <div className="gap-8 grid md:grid-cols-2 mx-auto max-w-5xl">
          {/* Only show plans that aren't currently subscribed */}
          {!isProMonthly && !isProYearly && plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative overflow-hidden group transition-all duration-300 bg-zinc-900 border-zinc-700/50 
                ${subscription?.status === "ACTIVE" ? "opacity-50 pointer-events-none" : "hover:border-indigo-500/30"}
                ${plan.highlight ? "ring-1 ring-indigo-500/20 hover:ring-indigo-400/30" : ""}`}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500 bg-gradient-to-b from-indigo-500/5 to-transparent"></div>
              
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-zinc-800">
                    <Zap className="w-5 h-5" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-white">
                  {plan.name}
                </CardTitle>
                <div className="flex items-baseline gap-1 mt-3">
                  <span className="font-bold text-3xl text-white">
                    ${plan.price}
                  </span>
                  <span className="text-zinc-400">
                    /{plan.interval}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="pb-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-zinc-300">
                      <div className="rounded-full p-0.5 text-emerald-400 bg-emerald-500/10">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter className="pt-2">
                <Button
                  className="w-full font-medium rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
                  size="lg"
                  disabled={processingPlan === plan.id || subscription?.status === "ACTIVE"}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {subscription?.status === "ACTIVE" ? (
                    <>
                      <Check className="mr-2 w-4 h-4" />
                      Already Subscribed
                    </>
                  ) : processingPlan === plan.id ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 w-4 h-4" />
                      Upgrade Now
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}

          {/* Show status message if user has any active subscription */}
          {(isProMonthly || isProYearly) && (
            <div className="md:col-span-2 p-8 rounded-2xl bg-zinc-900/50 border border-zinc-700/50">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="bg-indigo-500/20 p-3 rounded-full">
                  <CheckCircle2 className="w-8 h-8 text-indigo-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Active Subscription
                  </h3>
                  <p className="text-zinc-400">
                    You&#39;re currently on the {isProMonthly ? "Pro Monthly" : "Pro Yearly"} plan
                  </p>
                  {subscription.currentPeriodEnd && (
                    <p className="text-sm text-zinc-500 mt-2">
                      Valid until {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Button
                  className="bg-zinc-800 hover:bg-zinc-700 text-white mt-4"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  View Subscription Details
                </Button>
              </div>
            </div>
          )}

          {/* Show "no plans" message if no plans are available */}
          {!isProMonthly && !isProYearly && plans.length === 0 && (
            <div className="md:col-span-2 p-8 rounded-2xl bg-zinc-900/50 border border-zinc-700/50 text-center">
              <p className="text-zinc-400">No subscription plans are currently available.</p>
            </div>
          )}
        </div>
      )}

      {/* Only show security badge if plans are displayed */}
      {!isProMonthly && !isProYearly && plans.length > 0 && (
        <div className="mt-12 px-6 py-5 rounded-xl bg-zinc-900 border border-zinc-700 mx-auto max-w-lg text-center shadow-lg">
          <Shield className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
          <p className="text-zinc-300 text-sm">
            All plans include a 14-day money-back guarantee. No questions asked.
          </p>
          <p className="mt-2 text-zinc-500 text-xs">
            Need help choosing? Our support team is available 24/7 for assistance.
          </p>
        </div>
      )}

      {checkoutOpen && clientSecret && (
        <StripeCheckout 
          clientSecret={clientSecret}
          onSuccess={() => {
            setCheckoutOpen(false);
            setSuccess(true);
            window.location.reload(); // Reload to update subscription status
          }}
          onCancel={() => {
            setCheckoutOpen(false);
            setCanceled(true);
          }}
        />
      )}
    </div>
  );
}