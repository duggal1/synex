import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CreditCard, DollarSign, Users } from "lucide-react";
import prisma from "../utils/db";
import { requireUser } from "../utils/hooks";
import { formatCurrency } from "../utils/formatCurrency";
import { cn } from "@/lib/utils";

async function getData(userId: string) {
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

  // Calculate metrics
  const metrics = invoices.reduce((acc, invoice) => {
    // Total revenue
    acc.totalRevenue += invoice.total;

    // This month's metrics
    if (invoice.createdAt >= firstDayOfMonth && invoice.createdAt <= lastDayOfMonth) {
      acc.thisMonthTotal += invoice.total;
      if (invoice.status === "PAID") {
        acc.thisMonthPaid += invoice.total;
      }
    }

    // Last month's metrics
    if (invoice.createdAt >= firstDayOfLastMonth && invoice.createdAt <= lastDayOfLastMonth) {
      acc.lastMonthTotal += invoice.total;
      if (invoice.status === "PAID") {
        acc.lastMonthPaid += invoice.total;
      }
    }

    // Last 7 days metrics
    if (invoice.createdAt >= sevenDaysAgo) {
      acc.lastSevenDaysTotal += invoice.total;
      if (invoice.status === "PAID") {
        acc.lastSevenDaysPaid += invoice.total;
      }
      acc.lastSevenDaysCount++;
    }

    // Previous 7 days metrics (7-14 days ago)
    if (invoice.createdAt >= fourteenDaysAgo && invoice.createdAt < sevenDaysAgo) {
      acc.previousSevenDaysTotal += invoice.total;
      if (invoice.status === "PAID") {
        acc.previousSevenDaysPaid += invoice.total;
      }
      acc.previousSevenDaysCount++;
    }

    // Paid and pending counts
    if (invoice.status === "PAID") {
      acc.paidAmount += invoice.total;
      acc.paidCount++;
    } else {
      acc.pendingAmount += invoice.total;
      acc.pendingCount++;
    }

    return acc;
  }, {
    totalRevenue: 0,
    thisMonthTotal: 0,
    thisMonthPaid: 0,
    lastMonthTotal: 0,
    lastMonthPaid: 0,
    lastSevenDaysTotal: 0,
    lastSevenDaysPaid: 0,
    lastSevenDaysCount: 0,
    previousSevenDaysTotal: 0,
    previousSevenDaysPaid: 0,
    previousSevenDaysCount: 0,
    paidAmount: 0,
    paidCount: 0,
    pendingAmount: 0,
    pendingCount: 0,
  });

  // Calculate growth rates
  const revenueGrowth = metrics.lastMonthTotal === 0 ? 100 :
    Math.round(((metrics.thisMonthTotal - metrics.lastMonthTotal) / metrics.lastMonthTotal) * 100);

  const weeklyGrowth = metrics.previousSevenDaysTotal === 0 ? 100 :
    Math.round(((metrics.lastSevenDaysTotal - metrics.previousSevenDaysTotal) / metrics.previousSevenDaysTotal) * 100);

  const paidGrowth = metrics.paidCount === 0 ? 0 : 
    Math.round((metrics.paidCount / (metrics.paidCount + metrics.pendingCount)) * 100);

  const totalInvoices = metrics.paidCount + metrics.pendingCount;
  const invoiceGrowth = totalInvoices > 0 ? 100 : 0;

  // Calculate daily averages
  const dailyAverage = Math.round(metrics.lastSevenDaysTotal / 7);
  const previousDailyAverage = Math.round(metrics.previousSevenDaysTotal / 7);
  const dailyGrowth = previousDailyAverage === 0 ? 100 :
    Math.round(((dailyAverage - previousDailyAverage) / previousDailyAverage) * 100);

  return {
    totalRevenue: metrics.totalRevenue,
    paidAmount: metrics.paidAmount,
    pendingAmount: metrics.pendingAmount,
    totalInvoices,
    paidCount: metrics.paidCount,
    pendingCount: metrics.pendingCount,
    revenueGrowth,
    weeklyGrowth,
    paidGrowth,
    invoiceGrowth,
    dailyAverage,
    dailyGrowth,
    lastSevenDaysTotal: metrics.lastSevenDaysTotal,
    lastSevenDaysPaid: metrics.lastSevenDaysPaid,
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
      subtext: `${formatCurrency({ amount: data.lastSevenDaysTotal, currency: "USD" })} past 7 days`,
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