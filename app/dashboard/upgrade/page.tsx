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
  CheckCircle2,
  CreditCard
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
import StripeCheckout from "@/app/components/StripeCheckout";
import Loader from "@/components/Loader";

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
  description: string;
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
    description: "Perfect for individuals and small teams getting started",
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
    description: "Best value for businesses serious about growth",
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
          <p className="text-zinc-200 text-sm">You now have full access to all premium features.</p>
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
          <p className="text-zinc-200 text-sm">Your subscription status remains unchanged.</p>
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
    return <Loader />;
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
      <div className="px-6 py-20 min-h-screen">
        <div className="mx-auto max-w-3xl">
          {/* Success Animation - If just subscribed */}
          {success && (
            <div className="mb-16 text-center">
              <div className="relative flex flex-col items-center">
                <div className="relative flex justify-center items-center shadow-lg mb-8 rounded-full w-24 h-24">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <h2 className="mb-3 font-bold text-white text-3xl">Payment Successful</h2>
                <p className="text-zinc-300 text-lg">Your subscription is now active</p>
              </div>
            </div>
          )}

          {/* Subscription Card */}
          <div className="shadow-xl border border-zinc-800 rounded-3xl overflow-hidden">
            <div className="px-8 md:px-12 py-10">
              {/* Status Badge */}
              <div className="flex justify-center mb-10">
                <Badge className="bg-black/50 hover:bg-green-950/20 px-4 py-2 border border-green-950/80 rounded-full text-green-800 transition-colors duration-300">
                  <div className="flex items-center gap-2">
             
                    <span className="font-medium text-sm">Active Subscription</span>
                  </div>
                </Badge>
              </div>

              {/* Plan Info */}
              <div className="mb-12 text-center">
                <h1 className="bg-clip-text bg-gradient-to-r from-blue-600 to-purple-700 font-black text-transparent text-4xl">
                  {isYearly ? "Pro Annual" : "Pro Monthly"} Plan
                </h1>
                <p className="mt-4 text-zinc-300 text-lg">
                  Active until {endDate?.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="gap-5 grid grid-cols-1 md:grid-cols-3 mb-12">
                {[
                  {
                    label: "Plan Type",
                    value: isYearly ? "Annual" : "Monthly",
                    icon: <Clock className="w-5 h-5 text-blue-600" />,
                  },
                  {
                    label: "Days Left",
                    value: daysRemaining,
                    icon: <CalendarRange className="w-5 h-5 text-blue-600" />,
                  },
                  {
                    label: "Status",
                    value: "Active",
                    icon: <Shield className="w-5 h-5 text-blue-600" />,
                  }
                ].map((stat, i) => (
                  <div key={i} className="bg-black/30 hover:shadow-md hover:shadow-indigo-500/10 backdrop-blur-sm p-5 border border-zinc-800/60 hover:border-indigo-500/20 rounded-2xl transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-3 rounded-xl">
                        {stat.icon}
                      </div>
                      <div>
                        <p className="font-medium text-zinc-500 text-xs">{stat.label}</p>
                        <p className="font-semibold text-white text-xl">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="bg-black/30 backdrop-blur-sm mb-12 p-6 border border-zinc-800/60 rounded-2xl">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-200">Subscription Period</span>
                    <span className="font-medium text-zinc-100">{daysRemaining} days left</span>
                  </div>
                  <div className="bg-zinc-800/70 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-600 via-pink-600 to-purple-800 rounded-full h-full transition-all duration-1000"
                      style={{ width: `${remainingPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Features Grid */}
              <div className="gap-4 grid grid-cols-1 md:grid-cols-2 mb-12">
                {[
                  "Unlimited Invoices", 
                  "Custom Branding", 
                  "Client Portal", 
                  "Analytics Dashboard", 
                  "API Access",
                  "Priority Support"
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 hover:bg-zinc-800/20 p-3 rounded-xl transition-colors duration-200">
                    <div className="bg-indigo-500/10 p-1.5 rounded-full text-indigo-400">
                      <Check className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-zinc-200 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              
              {/* Call to Action Button */}
              <div className="flex justify-center">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-800 mt-16 rounded-xl font-semibold text-white/70 text-base">
                  Manage Subscription
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show plans for non-subscribed users
  return (
    <div className="bg-black px-6 py-20 min-h-screen">
      <div className="mx-auto max-w-5xl">
        {/* Success message */}
        {success && (
          <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 shadow-indigo-500/10 shadow-xl backdrop-blur-sm mx-auto mb-14 p-6 border border-indigo-500/30 rounded-2xl max-w-lg">
            <div className="flex items-center gap-5">
              <div className="bg-gradient-to-br from-indigo-500/30 to-purple-500/30 p-4 rounded-full">
                <CheckCircle2 className="w-7 h-7 text-indigo-400" />
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-white text-xl">
                  Payment Successful
                </h3>
                <p className="text-zinc-300 text-base">
                  Your subscription has been activated with full access to premium features.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <Badge variant="outline" className="bg-black/80 mb-6 px-4 py-1.5 border-indigo-500/40 rounded-full font-medium text-indigo-400 text-sm">
            Upgrade Today
          </Badge>
          <h1 className="bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-5 font-bold text-transparent text-5xl leading-tight">
            Elevate Your Experience
          </h1>
          <p className="mx-auto max-w-xl text-zinc-300 text-lg">
            Choose the perfect plan to unlock premium features and enhance your workflow
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="relative">
              <div className="border-2 border-indigo-500 border-t-transparent rounded-full w-16 h-16 animate-spin"></div>
              <Zap className="absolute inset-0 m-auto w-6 h-6 text-indigo-500" />
            </div>
          </div>
        ) : (
          <div className="gap-8 grid md:grid-cols-2 mx-auto max-w-4xl">
            {/* Show all plans, but disable buttons based on subscription status */}
            {plans.map((plan) => {
              const isYearly = plan.interval === "year";
              const isPlanActive = (isProMonthly && plan.id === "pro_monthly") || (isProYearly && plan.id === "pro_yearly");
              const isOtherPlanActive = (isProMonthly && plan.id === "pro_yearly") || (isProYearly && plan.id === "pro_monthly");
              
              // Skip rendering monthly plan if user has yearly subscription
              if (isProYearly && plan.id === "pro_monthly") {
                return null;
              }
              
              return (
                <Card
                  key={plan.id}
                  className={`bg-black border border-zinc-800/80 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/40 group ${plan.highlight ? "ring-2 ring-indigo-500/30" : ""} ${isPlanActive ? "border-indigo-500/50" : ""}`}
                >                
                  <CardHeader className="pt-8 pb-5">
                    <div className="mb-4">
                      <div className={`inline-flex ${isYearly ? "bg-gradient-to-br from-indigo-500/30 to-purple-500/30" : "bg-black/80 border border-zinc-800"} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                        {plan.icon}
                      </div>
                    </div>
                    {isYearly && (
                    <Badge variant="outline" className="bg-black/60 mb-4 px-2 py-1 border border-violet-500/30 rounded-lg font-medium text-violet-500 text-xs tracking-wide">
                    🎉 Most Popular
                  </Badge>
                  
                    )}
                    {isPlanActive && (
                     <Badge className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 mb-6 px-4 py-1.5 border-none rounded-full font-medium text-indigo-400 text-sm">
                        Current Plan
                     </Badge>
                    )}
                    <CardTitle className="mb-2 font-bold text-white text-2xl">
                      {plan.name}
                    </CardTitle>
                    <p className="text-zinc-400 text-sm">{plan.description}</p>
                    <div className="flex items-baseline gap-2 mt-5">
                      <span className="font-bold text-white text-4xl">
                        ${plan.price}
                      </span>
                      <span className="text-zinc-400 text-base">
                        /{plan.interval}
                      </span>
                    </div>
                    {isYearly && plan.originalPrice && (
                      <div className="mt-2 text-zinc-500 text-sm">
                        <span className="line-through">${plan.originalPrice}</span>
                        <span className="ml-2 font-medium text-indigo-400">Save {calculateAnnualPrice(19.99).savingsPercentage}%</span>
                      </div>
                    )}
                  </CardHeader>
                  
                  <CardContent className="pb-8">
                    <ul className="space-y-4">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-3 transition-transform group-hover:translate-x-1 duration-200">
                          <div className="bg-gradient-to-br from-indigo-500/30 to-purple-500/10 p-1.5 rounded-full">
                            <Check className="w-4 h-4 text-indigo-400" />
                          </div>
                          <span className="text-zinc-200 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  
                  <CardFooter className="pt-2 pb-8">
                    <Button
                      className={`${
                        isPlanActive 
                          ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" 
                          : isYearly 
                            ? "bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-800 hover:to-purple-700" 
                            : "bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-800 hover:to-violet-600"
                      } rounded-xl w-full font-medium py-6 text-base group-hover:scale-105 transition-all duration-300 shadow-lg ${isPlanActive ? "shadow-green-500/20" : "shadow-indigo-500/20"}`}
                      size="lg"
                      disabled={processingPlan === plan.id || isPlanActive}
                      onClick={() => handleUpgrade(plan.id)}
                    >
                      {isPlanActive ? (
                        <>
                          <Check className="mr-2 w-5 h-5" />
                          Current Plan
                        </>
                      ) : processingPlan === plan.id ? (
                        <>
                          <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : isOtherPlanActive ? (
                        <>
                          <ArrowRight className="mr-2 w-5 h-5" />
                          {isYearly ? "Upgrade to Annual" : "Switch to Monthly"}
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 w-5 h-5" />
                          {isYearly ? "Get Annual Plan" : "Get Monthly Plan"}
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}

            {/* Show status message if user has any active subscription */}
            {(isProMonthly || isProYearly) && !plans.some(plan => 
              (isProMonthly && plan.id === "pro_yearly") || 
              (isProYearly && plan.id === "pro_monthly")
            ) && (
              <div className="md:col-span-2 bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 shadow-indigo-500/10 shadow-xl p-8 border border-indigo-500/30 rounded-2xl">
                <div className="flex flex-col justify-center items-center space-y-6">
                  <div className="bg-gradient-to-br from-indigo-500/30 to-purple-500/30 p-4 rounded-full">
                    <CheckCircle2 className="w-8 h-8 text-indigo-400" />
                  </div>
                  <div className="text-center">
                    <h3 className="mb-3 font-bold text-white text-2xl">
                      Active Subscription
                    </h3>
                    <p className="text-zinc-300 text-lg">
                      You&apos;re currently on the {isProMonthly ? "Pro Monthly" : "Pro Yearly"} plan
                    </p>
                    {subscription?.currentPeriodEnd && (
                      <p className="mt-3 text-zinc-500 text-base">
                        Valid until {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                  </div>
                  <Button
                    className="bg-gradient-to-r from-indigo-600 hover:from-indigo-700 to-purple-600 hover:to-purple-700 shadow-indigo-500/20 shadow-lg px-6 py-6 border-none rounded-xl font-medium text-white text-base"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            )}

            {/* No plans available message */}
            {plans.length === 0 && (
              <div className="md:col-span-2 bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 p-8 border border-zinc-800 rounded-2xl text-center">
                <p className="text-zinc-300 text-lg">No subscription plans are currently available.</p>
              </div>
            )}
          </div>
        )}

        {/* Security badge */}
        {plans.length > 0 && (
          <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-sm mx-auto mt-14 p-6 border border-zinc-800/80 rounded-xl max-w-md text-center">
            <div className="flex flex-col items-center">
              <div className="bg-gradient-to-br from-indigo-500/30 to-purple-500/20 mb-4 p-3 rounded-full">
                <Shield className="w-6 h-6 text-indigo-400" />
              </div>
              <p className="font-medium text-zinc-200 text-base">
                All plans include a 14-day money-back guarantee
              </p>
              <p className="mt-3 text-zinc-400 text-sm">
                24/7 support available for assistance
              </p>
            </div>
          </div>
        )}

        {checkoutOpen && clientSecret && (
          <StripeCheckout 
            clientSecret={clientSecret}
            onSuccess={() => {
              setCheckoutOpen(false);
              setSuccess(true);
              window.location.reload();
            }}
            onCancel={() => {
              setCheckoutOpen(false);
              setCanceled(true);
            }}
          />
        )}
      </div>
    </div>
  );
}