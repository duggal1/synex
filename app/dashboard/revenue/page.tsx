import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireUser } from "@/app/utils/hooks";
import prisma from "@/app/utils/db";
import { formatCurrency } from "@/app/utils/formatCurrency";
import { cn } from "@/lib/utils";
import { RevenueDashboard } from "@/app/components/RevenueDashboard";

async function getRevenueData(userId: string) {
  // Get time periods
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  // Get the first day of each month for the last 6 months
  const monthsData = [];
  for (let i = 0; i < 6; i++) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthsData.push({
      month: month.toLocaleString('default', { month: 'short' }),
      firstDay: new Date(month.getFullYear(), month.getMonth(), 1),
      lastDay: new Date(month.getFullYear(), month.getMonth() + 1, 0),
    });
  }
  
  // Fetch all invoices
  const invoices = await prisma.invoice.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      total: true,
      status: true,
      createdAt: true,
      paidAt: true,
      currency: true,
    },
  });

  // Calculate monthly revenue
  const monthlyRevenue = monthsData.map(({ month, firstDay, lastDay }) => {
    const monthInvoices = invoices.filter(
      invoice => invoice.createdAt >= firstDay && invoice.createdAt <= lastDay
    );
    
    const totalAmount = monthInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const paidAmount = monthInvoices
      .filter(invoice => invoice.status === "PAID")
      .reduce((sum, invoice) => sum + invoice.total, 0);
    
    return {
      name: month,
      total: totalAmount,
      paid: paidAmount,
    };
  }).reverse();

  // Calculate payment method breakdown
  const paymentMethodsData = [
    {
      name: "MANUAL",
      value: invoices
        .filter(invoice => invoice.status === "PAID")
        .reduce((sum, invoice) => sum + invoice.total, 0),
      count: invoices.filter(invoice => invoice.status === "PAID").length,
    }
  ];

  // Calculate current month metrics
  const currentMonthInvoices = invoices.filter(
    invoice => invoice.createdAt >= firstDayOfMonth && invoice.createdAt <= lastDayOfMonth
  );
  
  const currentMonthTotal = currentMonthInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const currentMonthPaid = currentMonthInvoices
    .filter(invoice => invoice.status === "PAID")
    .reduce((sum, invoice) => sum + invoice.total, 0);
  
  const paymentRate = currentMonthTotal > 0 
    ? Math.round((currentMonthPaid / currentMonthTotal) * 100) 
    : 0;

  // Calculate total metrics
  const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const totalPaid = invoices
    .filter(invoice => invoice.status === "PAID")
    .reduce((sum, invoice) => sum + invoice.total, 0);
  
  const totalPaymentRate = totalRevenue > 0 
    ? Math.round((totalPaid / totalRevenue) * 100) 
    : 0;

  // Calculate average invoice value
  const averageInvoiceValue = invoices.length > 0 
    ? Math.round(totalRevenue / invoices.length) 
    : 0;

  return {
    monthlyRevenue,
    paymentMethodsData,
    currentMonthTotal,
    currentMonthPaid,
    paymentRate,
    totalRevenue,
    totalPaid,
    totalPaymentRate,
    averageInvoiceValue,
  };
}

export default async function RevenuePage() {
  const session = await requireUser();
  const data = await getRevenueData(session.user?.id as string);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl tracking-tight">Revenue Dashboard</h1>
        <p className="text-muted-foreground">
          Track your revenue and payment analytics
        </p>
      </div>

      <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-4">
        <Card className={cn(
          "relative overflow-hidden",
          "bg-black/40 hover:bg-black/60",
          "border-neutral-800/50",
          "backdrop-blur-sm transition-all duration-300",
          "hover:translate-y-[-2px]",
        )}>
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
          "border-neutral-800/50",
          "backdrop-blur-sm transition-all duration-300",
          "hover:translate-y-[-2px]",
        )}>
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
          "border-neutral-800/50",
          "backdrop-blur-sm transition-all duration-300",
          "hover:translate-y-[-2px]",
        )}>
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
          "border-neutral-800/50",
          "backdrop-blur-sm transition-all duration-300",
          "hover:translate-y-[-2px]",
        )}>
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
    </div>
  );
} 