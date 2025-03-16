import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CreditCard, DollarSign, Users } from "lucide-react";
import prisma from "../utils/db";
import { requireUser } from "../utils/hooks";
import { formatCurrency } from "../utils/formatCurrency";
import { cn } from "@/lib/utils";

interface DashboardMetrics {
  totalRevenue: number;
  paidAmount: number;
  pendingAmount: number;
  totalInvoices: number;
  paidCount: number;
  pendingCount: number;
  revenueGrowth: number;
  weeklyGrowth: number;
  dailyAverage: number;
  dailyGrowth: number;
  lastSevenDaysPaid: number;
  paidGrowth: number;  // Added this field
}

async function getData(userId: string): Promise<DashboardMetrics> {
  // Get time periods
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Fetch all relevant invoice data
  const invoices = await prisma.invoice.findMany({
    where: {
      userId,
      createdAt: {
        gte: fourteenDaysAgo, // Get data from 14 days ago to compare weekly growth
      },
    },
    select: {
      total: true,
      status: true,
      createdAt: true,
      paidAt: true,
    },
  });

  // Calculate metrics - only count PAID invoices for revenue
  const metrics = invoices.reduce((acc, invoice) => {
    // Only add to revenue metrics if invoice is PAID
    if (invoice.status === "PAID") {
      // Total revenue (only from paid invoices)
      acc.totalRevenue += invoice.total;

      // This month's paid metrics
      if (invoice.paidAt && invoice.paidAt >= firstDayOfMonth && invoice.paidAt <= lastDayOfMonth) {
        acc.thisMonthPaid += invoice.total;
      }

      // Last month's paid metrics
      if (invoice.paidAt && invoice.paidAt >= firstDayOfLastMonth && invoice.paidAt <= lastDayOfLastMonth) {
        acc.lastMonthPaid += invoice.total;
      }

      // Last 7 days paid metrics
      if (invoice.paidAt && invoice.paidAt >= sevenDaysAgo) {
        acc.lastSevenDaysPaid += invoice.total;
      }

      // Previous 7 days paid metrics
      if (invoice.paidAt && invoice.paidAt >= fourteenDaysAgo && invoice.paidAt < sevenDaysAgo) {
        acc.previousSevenDaysPaid += invoice.total;
      }

      acc.paidAmount += invoice.total;
      acc.paidCount++;
    } else {
      // Track pending amounts separately
      acc.pendingAmount += invoice.total;
      acc.pendingCount++;
    }

    return acc;
  }, {
    totalRevenue: 0,
    thisMonthPaid: 0,
    lastMonthPaid: 0,
    lastSevenDaysPaid: 0,
    previousSevenDaysPaid: 0,
    paidAmount: 0,
    paidCount: 0,
    pendingAmount: 0,
    pendingCount: 0,
  });

  // Calculate growth rates based on paid amounts only
  const revenueGrowth = metrics.lastMonthPaid === 0 ? 0 :
    Math.round(((metrics.thisMonthPaid - metrics.lastMonthPaid) / metrics.lastMonthPaid) * 100);

  const weeklyGrowth = metrics.previousSevenDaysPaid === 0 ? 0 :
    Math.round(((metrics.lastSevenDaysPaid - metrics.previousSevenDaysPaid) / metrics.previousSevenDaysPaid) * 100);

  // Calculate daily average from paid invoices
  const dailyAverage = Math.round(metrics.lastSevenDaysPaid / 7);
  const previousDailyAverage = Math.round(metrics.previousSevenDaysPaid / 7);
  const dailyGrowth = previousDailyAverage === 0 ? 0 :
    Math.round(((dailyAverage - previousDailyAverage) / previousDailyAverage) * 100);

  // Calculate paid growth rate
  const paidGrowth = metrics.pendingCount === 0 ? 100 :
    Math.round((metrics.paidCount / (metrics.paidCount + metrics.pendingCount)) * 100);

  return {
    // Revenue metrics (only from paid invoices)
    totalRevenue: metrics.totalRevenue,
    paidAmount: metrics.paidAmount,
    // Pending metrics (separate from revenue)
    pendingAmount: metrics.pendingAmount,
    totalInvoices: metrics.paidCount + metrics.pendingCount,
    paidCount: metrics.paidCount,
    pendingCount: metrics.pendingCount,
    // Growth metrics (based on paid amounts)
    revenueGrowth,
    weeklyGrowth,
    dailyAverage,
    dailyGrowth,
    lastSevenDaysPaid: metrics.lastSevenDaysPaid,
    paidGrowth,  // Add this to the returned object
  };
}

export async function DashboardBlocks() {
  const session = await requireUser();
  const data = await getData(session.user?.id as string);

  const cards = [
    {
      title: "Total Revenue",
      value: formatCurrency({ amount: data.totalRevenue, currency: "USD" }),
      description: `${data.revenueGrowth}% from last month`,
      subtext: `${data.weeklyGrowth}% past 7 days`,
      icon: DollarSign,
      accentColor: "from-violet-600 to-indigo-600",
      textColor: "text-violet-600",
      trend: data.revenueGrowth,
    },
    {
      title: "Paid Amount",
      value: formatCurrency({ amount: data.paidAmount, currency: "USD" }),
      description: `${data.paidCount} invoices paid`,
      subtext: `${formatCurrency({ amount: data.lastSevenDaysPaid, currency: "USD" })} this week`,
      icon: CreditCard,
      accentColor: "from-emerald-600 to-teal-600",
      textColor: "text-emerald-600",
      trend: data.paidGrowth,
    },
    {
      title: "Daily Average",
      value: formatCurrency({ amount: data.dailyAverage, currency: "USD" }),
      description: `${data.dailyGrowth}% vs last week`,
      subtext: `${formatCurrency({ amount: data.lastSevenDaysPaid, currency: "USD" })} past 7 days`,
      icon: Users,
      accentColor: "from-blue-600 to-cyan-600",
      textColor: "text-blue-600",
      trend: data.dailyGrowth,
    },
    {
      title: "Pending Amount",
      value: formatCurrency({ 
        amount: data.pendingAmount,
        currency: "USD"
      }),
      description: `${data.pendingCount} invoices pending`,
      subtext: `${data.weeklyGrowth}% collection rate`,
      icon: Activity,
      accentColor: "from-orange-600 to-amber-600",
      textColor: "text-orange-600",
      trend: data.pendingCount > 0 ? -data.pendingCount : 0,
    },
  ];

  return (
    <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <div key={index} 
          className={cn(
            "opacity-0",
            "animate-fade-in-up",
            `delay-${index * 150}`
          )}
        >
          <Card className={cn(
            "relative overflow-hidden",
            "bg-black/40 hover:bg-black/60",
            "border-neutral-800/50",
            "backdrop-blur-sm transition-all duration-300",
            "hover:translate-y-[-2px]",
            "group"
          )}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="font-normal text-neutral-400 text-sm tracking-wide">
                  {card.title}
                </CardTitle>
                <div className={cn(
                  "p-2 rounded-lg",
                  "bg-black/30 group-hover:bg-black/50",
                  "transition-colors duration-300"
                )}>
                  <card.icon className="group-hover:text-white size-4 text-neutral-500 transition-colors duration-300" />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="font-medium text-white text-2xl tracking-tight">
                    {card.value}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {card.trend !== 0 && (
                    <span className={cn(
                      "text-xs font-medium",
                      card.trend > 0 ? "text-emerald-500" : "text-red-500"
                    )}>
                      {card.trend > 0 ? "↑" : "↓"} {Math.abs(card.trend)}%
                    </span>
                  )}
                  <span className="text-neutral-500 text-xs">
                    {card.description}
                  </span>
                </div>
                <div className="mt-2 text-neutral-400 text-xs">
                  {card.subtext}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}