import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireUser } from "@/app/utils/hooks";
import prisma from "@/app/utils/db";
import { formatCurrency } from "@/app/utils/formatCurrency";
import { cn } from "@/lib/utils";
import { RevenueDashboard } from "@/app/components/RevenueDashboard";
import { CurrencyType } from "@/app/types/currency";

async function getRevenueData(userId: string) {
  // Get time periods with more precision
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  // Get daily data for the last 30 days
  const dailyData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
      dayName: date.toLocaleDateString('default', { weekday: 'short' }),
      fullDate: date.toLocaleDateString('default', { month: 'short', day: 'numeric' })
    };
  }).reverse();

  // Get the first day of each month for the last 12 months for better trend analysis
  const monthsData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      month: month.toLocaleString('default', { month: 'short' }),
      year: month.getFullYear(),
      firstDay: new Date(month.getFullYear(), month.getMonth(), 1),
      lastDay: new Date(month.getFullYear(), month.getMonth() + 1, 0),
    };
  });

  // Fetch all invoices with detailed payment info
  const invoices = await prisma.invoice.findMany({
    where: {
      userId,
      createdAt: {
        gte: monthsData[monthsData.length - 1].firstDay // Last 12 months
      }
    },
    select: {
      id: true,
      total: true,
      status: true,
      createdAt: true,
      paidAt: true,
      currency: true,
      paymentMethod: true,
      clientName: true,
      invoiceNumber: true,
      paymentDetails: {
        select: {
          amount: true,
          paymentStatus: true,
          paymentMethod: true,
          createdAt: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Calculate daily revenue for the last 30 days
  const dailyRevenue = dailyData.map(({ date, dayName, fullDate }) => {
    const dayInvoices = invoices.filter(
      invoice => {
        const invoiceDate = new Date(invoice.createdAt);
        return invoiceDate.getFullYear() === date.getFullYear() &&
               invoiceDate.getMonth() === date.getMonth() &&
               invoiceDate.getDate() === date.getDate();
      }
    );
    
    const totalAmount = dayInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const paidAmount = dayInvoices
      .filter(invoice => invoice.status === "PAID")
      .reduce((sum, invoice) => sum + invoice.total, 0);
    
    return {
      name: dayName,
      fullDate,
      total: totalAmount,
      paid: paidAmount,
    };
  });

  // Calculate monthly revenue with year-over-year growth
  const monthlyRevenue = monthsData.map(({ month, year, firstDay, lastDay }) => {
    const monthInvoices = invoices.filter(
      invoice => invoice.createdAt >= firstDay && invoice.createdAt <= lastDay
    );
    
    const totalAmount = monthInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const paidAmount = monthInvoices
      .filter(invoice => invoice.status === "PAID")
      .reduce((sum, invoice) => sum + invoice.total, 0);
    
    return {
      name: `${month} ${year}`,
      total: totalAmount,
      paid: paidAmount,
    };
  }).reverse();

  // Calculate payment method breakdown with growth metrics
  const paymentMethodsData = [
    {
      name: "Stripe",
      value: invoices
        .filter(invoice => invoice.status === "PAID" && invoice.paymentMethod === "STRIPE")
        .reduce((sum, invoice) => sum + invoice.total, 0),
      count: invoices.filter(invoice => invoice.status === "PAID" && invoice.paymentMethod === "STRIPE").length,
      recentCount: invoices.filter(invoice => 
        invoice.status === "PAID" && 
        invoice.paymentMethod === "STRIPE" &&
        invoice.paidAt && 
        invoice.paidAt >= new Date(now.setDate(now.getDate() - 30))
      ).length
    },
    {
      name: "Manual",
      value: invoices
        .filter(invoice => invoice.status === "PAID" && invoice.paymentMethod === "MANUAL")
        .reduce((sum, invoice) => sum + invoice.total, 0),
      count: invoices.filter(invoice => invoice.status === "PAID" && invoice.paymentMethod === "MANUAL").length,
      recentCount: invoices.filter(invoice => 
        invoice.status === "PAID" && 
        invoice.paymentMethod === "MANUAL" &&
        invoice.paidAt && 
        invoice.paidAt >= new Date(now.setDate(now.getDate() - 30))
      ).length
    },
    {
      name: "Email",
      value: invoices
        .filter(invoice => invoice.status === "PAID" && invoice.paymentMethod === "EMAIL")
        .reduce((sum, invoice) => sum + invoice.total, 0),
      count: invoices.filter(invoice => invoice.status === "PAID" && invoice.paymentMethod === "EMAIL").length,
      recentCount: invoices.filter(invoice => 
        invoice.status === "PAID" && 
        invoice.paymentMethod === "EMAIL" &&
        invoice.paidAt && 
        invoice.paidAt >= new Date(now.setDate(now.getDate() - 30))
      ).length
    }
  ];

  // Calculate current month metrics with daily averages
  const currentMonthInvoices = invoices.filter(
    invoice => invoice.createdAt >= firstDayOfMonth && invoice.createdAt <= lastDayOfMonth
  );
  
  const currentMonthTotal = currentMonthInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const currentMonthPaid = currentMonthInvoices
    .filter(invoice => invoice.status === "PAID")
    .reduce((sum, invoice) => sum + invoice.total, 0);
  
  const daysSoFar = Math.max(1, now.getDate());
  const dailyAverage = Math.round(currentMonthTotal / daysSoFar);
  
  const paymentRate = currentMonthTotal > 0 
    ? Math.round((currentMonthPaid / currentMonthTotal) * 100) 
    : 0;

  // Calculate total metrics with trends
  const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const totalPaid = invoices
    .filter(invoice => invoice.status === "PAID")
    .reduce((sum, invoice) => sum + invoice.total, 0);
  
  const totalPaymentRate = totalRevenue > 0 
    ? Math.round((totalPaid / totalRevenue) * 100) 
    : 0;

  // Calculate advanced metrics
  const averageInvoiceValue = invoices.length > 0 
    ? Math.round(totalRevenue / invoices.length) 
    : 0;

  const averageTimeToPayment = invoices
    .filter(invoice => invoice.status === "PAID" && invoice.paidAt)
    .reduce((sum, invoice) => {
      const createdDate = new Date(invoice.createdAt);
      const paidDate = new Date(invoice.paidAt!);
      return sum + (paidDate.getTime() - createdDate.getTime());
    }, 0) / (invoices.filter(invoice => invoice.status === "PAID").length || 1);

  const averageDaysToPayment = Math.round(averageTimeToPayment / (1000 * 60 * 60 * 24));

  // Get recent successful payments with more details
  const recentPayments = invoices
    .filter(invoice => invoice.status === "PAID" && invoice.paidAt)
    .sort((a, b) => (b.paidAt?.getTime() || 0) - (a.paidAt?.getTime() || 0))
    .slice(0, 5)
    .map(payment => ({
      ...payment,
      formattedDate: payment.paidAt?.toLocaleDateString('default', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));

  return {
    dailyRevenue,
    monthlyRevenue,
    paymentMethodsData,
    currentMonthTotal,
    currentMonthPaid,
    dailyAverage,
    paymentRate,
    totalRevenue,
    totalPaid,
    totalPaymentRate,
    averageInvoiceValue,
    averageDaysToPayment,
    recentPayments
  };
}

export default async function RevenuePage() {
  const session = await requireUser();
  const data = await getRevenueData(session.user?.id as string);

  return (
    <div className="space-y-8 bg-[#030303] p-6 min-h-screen">
      <div>
        <h1 className="mb-2 font-bold text-white/90 text-3xl tracking-tight">Revenue Dashboard</h1>
        <p className="text-zinc-400">
          Track your revenue and payment analytics
        </p>
      </div>

      <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-4">
        <Card className={cn(
          "relative overflow-hidden",
          "bg-black/40 hover:bg-black/60",
          "border-zinc-800/30",
          "backdrop-blur-xl transition-all duration-300",
          "hover:translate-y-[-2px]",
          "group"
        )}>
          {/* Add subtle gradient hover effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-blue-500/0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-neutral-400 text-sm">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {formatCurrency({ amount: data.totalRevenue, currency: "USD" })}
            </div>
            <p className="mt-1 text-neutral-500 text-xs">
              {data.totalPaymentRate}% payment rate
            </p>
          </CardContent>
        </Card>
        <Card className={cn(
          "relative overflow-hidden",
          "bg-black/40 hover:bg-black/60",
          "border-zinc-800/30",
          "backdrop-blur-xl transition-all duration-300",
          "hover:translate-y-[-2px]",
          "group"
        )}>
          {/* Add subtle gradient hover effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-blue-500/0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-neutral-400 text-sm">
              Total Collected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {formatCurrency({ amount: data.totalPaid, currency: "USD" })}
            </div>
            <p className="mt-1 text-neutral-500 text-xs">
              {formatCurrency({ amount: data.totalRevenue - data.totalPaid, currency: "USD" })} outstanding
            </p>
          </CardContent>
        </Card>
        <Card className={cn(
          "relative overflow-hidden",
          "bg-black/40 hover:bg-black/60",
          "border-zinc-800/30",
          "backdrop-blur-xl transition-all duration-300",
          "hover:translate-y-[-2px]",
          "group"
        )}>
          {/* Add subtle gradient hover effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-blue-500/0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-neutral-400 text-sm">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {formatCurrency({ amount: data.currentMonthTotal, currency: "USD" })}
            </div>
            <p className="mt-1 text-neutral-500 text-xs">
              {data.paymentRate}% payment rate
            </p>
          </CardContent>
        </Card>
        <Card className={cn(
          "relative overflow-hidden",
          "bg-black/40 hover:bg-black/60",
          "border-zinc-800/30",
          "backdrop-blur-xl transition-all duration-300",
          "hover:translate-y-[-2px]",
          "group"
        )}>
          {/* Add subtle gradient hover effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-blue-500/0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-neutral-400 text-sm">
              Average Invoice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {formatCurrency({ amount: data.averageInvoiceValue, currency: "USD" })}
            </div>
            <p className="mt-1 text-neutral-500 text-xs">
              Per invoice value
            </p>
          </CardContent>
        </Card>
      </div>

      <RevenueDashboard data={data} />

      <Card className={cn(
        "relative overflow-hidden",
        "bg-black/40",
        "border-zinc-800/30",
        "backdrop-blur-xl"
      )}>
        <CardHeader>
          <CardTitle className="text-neutral-400 text-sm">Recent Payments</CardTitle>
          <CardDescription>
            Your latest successful payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentPayments.map((payment) => (
              <div key={payment.id} className="flex justify-between items-center bg-black/20 p-4 rounded-lg">
                <div>
                  <p className="font-medium">Payment #{payment.id.slice(0, 8)}</p>
                  <p className="text-neutral-500 text-sm">
                    {payment.formattedDate}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-emerald-500">
                    {formatCurrency({ amount: payment.total, currency: (payment.currency as CurrencyType) || "USD" })}
                  </p>
                  <p className="text-neutral-500 text-sm">
                    via {payment.paymentMethod}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}