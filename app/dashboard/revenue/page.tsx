"use client";
import { RevenueDashboard } from "@/app/components/RevenueDashboard";
import { CurrencyType } from "@/app/types/currencies";
import { useEffect, useState } from "react";
import { format, subDays, startOfMonth, endOfMonth, differenceInDays } from "date-fns";
import { getInvoices, Invoice } from "@/app/actions/invoices";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "@/components/Loader";
import { useSession } from "next-auth/react";
import Link from "next/link";


interface RecentPayment {
  id: string;
  total: number;
  currency?: CurrencyType;
  paymentMethod?: string;
  formattedDate: string;
  status: string;
  customerName?: string;
}

interface RevenueData {
  dailyRevenue: Array<{
    name: string;
    fullDate: string;
    total: number;
    paid: number;
  }>;
  monthlyRevenue: Array<{
    name: string;
    total: number;
    paid: number;
  }>;
  paymentMethodsData: Array<{
    name: string;
    value: number;
    count: number;
    recentCount: number;
  }>;
  currentMonthTotal: number;
  currentMonthPaid: number;
  dailyAverage: number;
  paymentRate: number;
  totalRevenue: number;
  totalPaid: number;
  totalPaymentRate: number;
  averageInvoiceValue: number;
  averageDaysToPayment: number;
  recentPayments: Array<{
    id: string;
    total: number;
    currency?: CurrencyType;
    paymentMethod?: string;
    formattedDate: string;
    status: string;
    customerName?: string;
  }>;
  weeklyGrowth: number;
  monthlyGrowth: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  averageTicketSize: number;
  topPaymentMethods: Array<{
    method: string;
    percentage: number;
    amount: number;
  }>;
}

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAllPayments, setShowAllPayments] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    async function fetchData() {
      try {
        // Only fetch invoices if we have a user ID
        const userId = session?.user?.id;
        if (!userId) {
          return;
        }
        
        const invoices = await getInvoices(userId);
        
        // If no invoices, set empty data
        if (invoices.length === 0) {
          setData({
            dailyRevenue: [],
            monthlyRevenue: [],
            paymentMethodsData: [],
            currentMonthTotal: 0,
            currentMonthPaid: 0,
            dailyAverage: 0,
            paymentRate: 0,
            totalRevenue: 0,
            totalPaid: 0,
            totalPaymentRate: 0,
            averageInvoiceValue: 0,
            averageDaysToPayment: 0,
            recentPayments: [],
            weeklyGrowth: 0,
            monthlyGrowth: 0,
            successfulPayments: 0,
            failedPayments: 0,
            pendingPayments: 0,
            averageTicketSize: 0,
            topPaymentMethods: []
          });
          return;
        }
        
        // Calculate daily revenue for the last 30 days
        const dailyRevenue = Array.from({ length: 30 }, (_, i) => {
          const date = subDays(new Date(), i);
          const dayInvoices = invoices.filter((invoice: Invoice) => {
            const invoiceDate = new Date(invoice.createdAt);
            return format(invoiceDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
          });
          
          return {
            name: format(date, 'MMM d'),
            fullDate: format(date, 'MMMM d, yyyy'),
            total: dayInvoices.reduce((sum: number, inv: Invoice) => sum + inv.total, 0),
            paid: dayInvoices.filter((inv: Invoice) => inv.status === 'paid').reduce((sum: number, inv: Invoice) => sum + inv.total, 0)
          };
        }).reverse();

        // Calculate monthly revenue for the last 12 months
        const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const start = startOfMonth(date);
          const end = endOfMonth(date);
          
          const monthInvoices = invoices.filter((invoice: Invoice) => {
            const invoiceDate = new Date(invoice.createdAt);
            return invoiceDate >= start && invoiceDate <= end;
          });

          return {
            name: format(date, 'MMM yyyy'),
            total: monthInvoices.reduce((sum: number, inv: Invoice) => sum + inv.total, 0),
            paid: monthInvoices.filter((inv: Invoice) => inv.status === 'paid').reduce((sum: number, inv: Invoice) => sum + inv.total, 0)
          };
        }).reverse();

        // Calculate payment methods breakdown
        const paymentMethods = invoices.reduce((acc: Record<string, { total: number; count: number; recentCount: number }>, invoice: Invoice) => {
          const method = invoice.paymentMethod || 'Manual';
          if (!acc[method]) {
            acc[method] = { total: 0, count: 0, recentCount: 0 };
          }
          acc[method].total += invoice.status === 'paid' ? invoice.total : 0;
          acc[method].count += invoice.status === 'paid' ? 1 : 0;
          
          // Count payments in the last 7 days
          const isRecent = differenceInDays(new Date(), new Date(invoice.createdAt)) <= 7;
          if (isRecent && invoice.status === 'paid') {
            acc[method].recentCount += 1;
          }
          
          return acc;
        }, {});

        // Calculate current month metrics
        const now = new Date();
        const currentMonthStart = startOfMonth(now);
        const currentMonthInvoices = invoices.filter((invoice: Invoice) => {
          const invoiceDate = new Date(invoice.createdAt);
          return invoiceDate >= currentMonthStart;
        });

        const currentMonthTotal = currentMonthInvoices.reduce((sum: number, inv: Invoice) => sum + inv.total, 0);
        const currentMonthPaid = currentMonthInvoices
          .filter((inv: Invoice) => inv.status === 'paid')
          .reduce((sum: number, inv: Invoice) => sum + inv.total, 0);

        // Calculate weekly and monthly growth
        const lastMonth = monthlyRevenue[monthlyRevenue.length - 2];
        const currentMonth = monthlyRevenue[monthlyRevenue.length - 1];
        const monthlyGrowth = lastMonth && lastMonth.paid > 0 
          ? Math.round(((currentMonth.paid - lastMonth.paid) / lastMonth.paid) * 100)
          : 0;

        const lastWeekRevenue = dailyRevenue.slice(-14, -7).reduce((sum, day) => sum + day.paid, 0);
        const thisWeekRevenue = dailyRevenue.slice(-7).reduce((sum, day) => sum + day.paid, 0);
        const weeklyGrowth = lastWeekRevenue > 0
          ? Math.round(((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100)
          : 0;

        // Calculate payment counts
        const successfulPayments = invoices.filter(inv => inv.status === 'paid').length;
        const failedPayments = invoices.filter(inv => inv.status === 'failed').length;
        const pendingPayments = invoices.filter(inv => inv.status === 'pending').length;

        // Calculate daily average for current month
        const daysInMonth = differenceInDays(now, currentMonthStart) + 1;
        const dailyAverage = currentMonthPaid / daysInMonth;

        // Calculate total metrics
        const totalRevenue = invoices.reduce((sum: number, inv: Invoice) => sum + inv.total, 0);
        const totalPaid = invoices
          .filter((inv: Invoice) => inv.status === 'paid')
          .reduce((sum: number, inv: Invoice) => sum + inv.total, 0);

        const totalPaymentRate = totalRevenue > 0 ? Math.round((totalPaid / totalRevenue) * 100) : 0;
        const paymentRate = currentMonthTotal > 0 
          ? Math.round((currentMonthPaid / currentMonthTotal) * 100)
          : 0;

        // Calculate average ticket size
        const averageTicketSize = successfulPayments > 0 ? totalPaid / successfulPayments : 0;

        // Calculate average invoice value
        const averageInvoiceValue = invoices.length > 0 ? totalRevenue / invoices.length : 0;

        // Calculate average days to payment
        const paidInvoices = invoices.filter((inv: Invoice) => inv.status === 'paid');
        const totalDaysToPayment = paidInvoices.reduce((sum: number, inv: Invoice) => {
          const createdDate = new Date(inv.createdAt);
          const paidDate = new Date(inv.paidAt || inv.createdAt);
          return sum + differenceInDays(paidDate, createdDate);
        }, 0);
        const averageDaysToPayment = paidInvoices.length > 0 ? Math.round(totalDaysToPayment / paidInvoices.length) : 0;

        // Calculate top payment methods
        const topPaymentMethods = Object.entries(paymentMethods)
          .map(([method, data]) => ({
            method,
            amount: data.total,
            percentage: totalPaid > 0 ? Math.round((data.total / totalPaid) * 100) : 0
          }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 3);

        // Get recent payments
        const recentPayments = paidInvoices
          .sort((a, b) => new Date(b.paidAt || b.createdAt).getTime() - new Date(a.paidAt || a.createdAt).getTime())
          .slice(0, 20)
          .map(payment => ({
            id: payment.id,
            total: payment.total,
            currency: payment.currency && Object.values(CurrencyType).includes(payment.currency as CurrencyType) 
              ? payment.currency as CurrencyType 
              : undefined,
            paymentMethod: payment.paymentMethod,
            formattedDate: format(new Date(payment.paidAt || payment.createdAt), 'MMM d, h:mm a'),
            status: payment.status,
            customerName: `Customer ${payment.id.slice(0, 4)}`
          }));

        setData({
          dailyRevenue,
          monthlyRevenue,
          paymentMethodsData: Object.entries(paymentMethods).map(([name, methodData]) => ({
            name,
            value: methodData.total,
            count: methodData.count,
            recentCount: methodData.recentCount
          })),
          currentMonthTotal,
          currentMonthPaid,
          dailyAverage,
          paymentRate,
          totalRevenue,
          totalPaid,
          totalPaymentRate,
          averageInvoiceValue,
          averageDaysToPayment,
          recentPayments,
          weeklyGrowth,
          monthlyGrowth,
          successfulPayments,
          failedPayments,
          pendingPayments,
          averageTicketSize,
          topPaymentMethods
        });
      } catch (err) {
        console.error('Error fetching revenue data:', err);
        setError('Failed to load revenue data. Please try again later.');
      }
    }

    // Only fetch data when session is available
    if (session?.user?.id) {
      fetchData();
    }
  }, [session]);

  if (!session) {
    return <Loader />;
  }

  if (!data) {
    return <Loader />;
  }

  return (
    <div className="relative bg-black min-h-screen">
      {/* Deep blue-black gradient background */}
    
      {/* Main content container */}
      <div className="z-10 relative mx-auto px-4 py-12 container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-end gap-4 mb-2">
            <h1 className="font-black text-white text-5xl">
              <span className="bg-clip-text bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 text-transparent">Revenue</span> Dashboard
            </h1>
          
          </div>
          <p className="max-w-2xl text-zinc-400 text-sm tracking-wide">
            Track your financial performance with real-time insights and analytics. Monitor revenue trends, payment success rates, and key business metrics all in one place.
          </p>
        </motion.div>

        <AnimatePresence>
          {data.dailyRevenue.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col justify-center items-center bg-black/40 backdrop-blur-xl p-12 border border-blue-900/20 rounded-xl"
            >
              <div className="text-center">
                <h2 className="mb-2 font-bold text-white text-xl">No Revenue Data Yet</h2>
                <p className="mb-6 text-zinc-400">You haven&apos;t created any invoices yet. Create your first invoice to start tracking your revenue.</p>
                <Link href="/dashboard/invoices/create" className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium text-white transition-all duration-300">
                  Create Your First Invoice
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <RevenueDashboard 
                data={data} 
                showAllPayments={showAllPayments}
                onViewAllClick={() => setShowAllPayments(!showAllPayments)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}