"use client";
import { Area, AreaChart, Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/app/utils/formatCurrency";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { CurrencyType } from "@/app/types/currency";

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

interface RevenueDashboardProps {
  data: RevenueData;
  showAllPayments?: boolean;
  onViewAllClick?: () => void;
}

interface RecentPayment {
  id: string;
  total: number;
  currency?: CurrencyType;
  paymentMethod?: string;
  formattedDate: string;
  status: string;
  customerName?: string;
}

const CustomTooltip = ({ active, payload, label, currency = "USD" }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 shadow-xl backdrop-blur-xl p-4 border border-blue-900/50 rounded-lg">
        <p className="mb-2 font-medium text-zinc-300 text-sm">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center gap-8">
              <span className="text-zinc-400 text-xs">{entry.name}</span>
              <span className={cn(
                "font-medium",
                entry.name === "Total" ? "text-blue-400" : "text-blue-500"
              )}>
                {formatCurrency({
                  amount: entry.value,
                  currency
                })}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function RevenueDashboard({ data, showAllPayments = false, onViewAllClick }: RevenueDashboardProps) {
  return (
    <div className="space-y-8">
      <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card className={cn(
          "relative overflow-hidden",
          "bg-black/40 hover:bg-black/60",
          "border-blue-900/20",
          "backdrop-blur-xl transition-all duration-300",
          "group"
        )}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-zinc-400 text-sm">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <p className="font-bold text-white text-2xl">
                {formatCurrency({ amount: data.totalRevenue, currency: "USD" })}
              </p>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  data.monthlyGrowth >= 0 ? "bg-blue-500/20 text-blue-400" : "bg-red-500/20 text-red-400"
                )}>
                  {data.monthlyGrowth >= 0 ? "+" : ""}{data.monthlyGrowth}%
                </span>
                <span className="text-zinc-500 text-xs">vs last month</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={cn(
          "relative overflow-hidden",
          "bg-black/40 hover:bg-black/60",
          "border-blue-900/20",
          "backdrop-blur-xl transition-all duration-300",
          "group"
        )}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-zinc-400 text-sm">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <p className="font-bold text-white text-2xl">{data.totalPaymentRate}%</p>
                <p className="text-zinc-500 text-xs">success rate</p>
              </div>
              <div className="flex items-center gap-4 text-zinc-400 text-xs">
                <span>{data.successfulPayments} successful</span>
                <span>{data.failedPayments} failed</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={cn(
          "relative overflow-hidden",
          "bg-black/40 hover:bg-black/60",
          "border-blue-900/20",
          "backdrop-blur-xl transition-all duration-300",
          "group"
        )}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-zinc-400 text-sm">Average Ticket</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <p className="font-bold text-white text-2xl">
                {formatCurrency({ amount: data.averageTicketSize, currency: "USD" })}
              </p>
              <p className="text-zinc-500 text-xs">per transaction</p>
            </div>
          </CardContent>
        </Card>
        <Card className={cn(
          "relative overflow-hidden",
          "bg-black/40 hover:bg-black/60",
          "border-blue-900/20",
          "backdrop-blur-xl transition-all duration-300",
          "group"
        )}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="pb-2">
            <CardTitle className="font-medium text-zinc-400 text-sm">Pending Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <p className="font-bold text-white text-2xl">
                {formatCurrency({ amount: data.totalRevenue - data.totalPaid, currency: "USD" })}
              </p>
              <p className="text-zinc-500 text-xs">{data.pendingPayments} pending payments</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-black/40 backdrop-blur-xl p-1 border border-blue-900/30 rounded-full">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-blue-600 px-6 rounded-full data-[state=active]:text-white transition-all duration-300"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-blue-600 px-6 rounded-full data-[state=active]:text-white transition-all duration-300"
          >
            Analytics
          </TabsTrigger>
          <TabsTrigger
            value="daily"
            className="data-[state=active]:bg-blue-600 px-6 rounded-full data-[state=active]:text-white transition-all duration-300"
          >
            Daily Trends
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className={cn(
              "lg:col-span-8",
              "relative overflow-hidden",
              "bg-black/40 hover:bg-black/60",
              "border-blue-900/20",
              "backdrop-blur-xl transition-all duration-300",
              "group"
            )}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader>
                <CardTitle className="font-medium text-zinc-400 text-sm">Revenue Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.monthlyRevenue}>
                      <defs>
                        <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3}/>
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="paidGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity={0.3}/>
                          <stop offset="100%" stopColor="#2563EB" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" opacity={0.2} />
                      <XAxis
                        dataKey="name"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        angle={-45}
                        textAnchor="end"
                        height={70}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="total"
                        name="Total"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#totalGradient)"
                      />
                      <Area
                        type="monotone"
                        dataKey="paid"
                        name="Paid"
                        stroke="#2563EB"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#paidGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className={cn(
              "lg:col-span-4",
              "relative overflow-hidden",
              "bg-black/40 hover:bg-black/60",
              "border-blue-900/20",
              "backdrop-blur-xl transition-all duration-300",
              "group"
            )}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader>
                <CardTitle className="font-medium text-zinc-400 text-sm">Payment Methods</CardTitle>
                <CardDescription className="text-zinc-500">
                  Breakdown by payment type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {data.paymentMethodsData.map((method, index) => (
                    <motion.div
                      key={method.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-zinc-300 text-sm">{method.name}</p>
                          <p className="text-zinc-500 text-xs">
                            {method.count} payments ({method.recentCount} recent)
                          </p>
                        </div>
                        <span className="font-medium text-blue-500 text-sm">
                          {formatCurrency({
                            amount: method.value,
                            currency: "USD"
                          })}
                        </span>
                      </div>
                      <div className="relative bg-zinc-800/50 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(method.value / data.totalPaid) * 100}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                          className="left-0 absolute inset-y-0 bg-blue-600/80 transition-all duration-300"
                        />
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(method.recentCount / method.count) * 100}%`,
                            left: `${(method.value / data.totalPaid) * 100}%`
                          }}
                          transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
                          className="absolute inset-y-0 bg-blue-300/30"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className={cn(
              "lg:col-span-12",
              "relative overflow-hidden",
              "bg-black/40 hover:bg-black/60",
              "border-blue-900/20",
              "backdrop-blur-xl transition-all duration-300",
              "group",
              "w-full"
            )}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader>
                <CardTitle className="font-medium text-zinc-400 text-sm">Recent Payments</CardTitle>
                <CardDescription className="text-zinc-500">
                  Latest transaction activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(showAllPayments ? data.recentPayments : data.recentPayments.slice(0, 8)).map((payment) => (
                    <div
                      key={payment.id}
                      className="bg-black/20 hover:bg-zinc-800/30 p-4 border border-blue-900/30 hover:border-blue-500/20 rounded-xl transition-all duration-300"
                    >
                      <div className="flex justify-between items-center w-full gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center">
                            <svg 
                              className="w-5 h-5 text-blue-500" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth="2" 
                                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                              />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-white text-sm truncate">
                              {payment.customerName || `Payment #${payment.id.slice(0, 8)}`}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="bg-zinc-800/50 px-2 py-0.5 rounded text-blue-400 text-xs">
                                {payment.paymentMethod || "Manual"}
                              </span>
                              <p className="text-zinc-400 text-xs">
                                {payment.formattedDate}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-blue-400 text-sm whitespace-nowrap">
                            {formatCurrency({
                              amount: payment.total,
                              currency: payment.currency || "USD"
                            })}
                          </p>
                          <p className="text-zinc-500 text-xs mt-1">
                            {payment.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {!showAllPayments && data.recentPayments.length > 8 && (
                  <div className="flex justify-center mt-6">
                    <button 
                      onClick={onViewAllClick}
                      className="bg-blue-500/10 hover:bg-blue-500/20 px-4 py-2 rounded-lg font-medium text-blue-500 text-sm transition-all duration-300"
                    >
                      View All Payments
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics">
          <div className="gap-6 grid md:grid-cols-2">
            <Card className={cn(
              "relative overflow-hidden",
              "bg-black/40 hover:bg-black/60",
              "border-blue-900/20",
              "backdrop-blur-xl transition-all duration-300",
              "group"
            )}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader>
                <CardTitle className="font-medium text-zinc-400 text-sm">Payment Success Rate</CardTitle>
                <CardDescription className="text-zinc-500">
                  Invoice payment performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col justify-center items-center space-y-6">
                  <div className="relative w-48 h-48">
                    <svg className="w-full h-full -rotate-90 transform">
                      <circle
                        className="stroke-zinc-800/30"
                        strokeWidth="12"
                        cx="96"
                        cy="96"
                        r="88"
                        fill="transparent"
                      />
                      <motion.circle
                        initial={{ strokeDasharray: "0 553" }}
                        animate={{ strokeDasharray: `${data.totalPaymentRate * 5.53} 553` }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className="stroke-blue-500"
                        strokeWidth="12"
                        strokeLinecap="round"
                        cx="96"
                        cy="96"
                        r="88"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute inset-0 flex justify-center items-center">
                      <div className="text-center">
                        <motion.p
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5, type: "spring" }}
                          className="font-bold text-blue-500 text-4xl"
                        >
                          {data.totalPaymentRate}%
                        </motion.p>
                        <p className="text-zinc-500 text-sm">Success Rate</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-center">
                    <p className="text-zinc-400 text-sm">
                      Average {data.averageDaysToPayment} days to payment
                    </p>
                    <div className="space-y-1 text-zinc-500 text-xs">
                      <p>
                        {formatCurrency({ amount: data.totalPaid, currency: "USD" })} collected
                      </p>
                      <p>
                        out of {formatCurrency({ amount: data.totalRevenue, currency: "USD" })}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={cn(
              "relative overflow-hidden",
              "bg-black/40 hover:bg-black/60",
              "border-blue-900/20",
              "backdrop-blur-xl transition-all duration-300",
              "group"
            )}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader>
                <CardTitle className="font-medium text-zinc-400 text-sm">Daily Performance</CardTitle>
                <CardDescription className="text-zinc-500">
                  Revenue trends and daily metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-500 rounded-full w-2 h-2" />
                      <p className="font-medium text-zinc-300 text-sm">Daily Average</p>
                    </div>
                    <p className="font-bold text-blue-500 text-3xl">
                      {formatCurrency({ amount: data.dailyAverage, currency: "USD" })}
                    </p>
                    <p className="text-zinc-500 text-xs">
                      per day this month
                    </p>
                  </div>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.dailyRevenue.slice(-14)}>
                        <defs>
                          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8}/>
                            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" opacity={0.2} />
                        <XAxis
                          dataKey="name"
                          stroke="#888888"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#888888"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="paid"
                          name="Revenue"
                          stroke="url(#lineGradient)"
                          strokeWidth={3}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="daily">
          <Card className={cn(
            "relative overflow-hidden",
            "bg-black/40 hover:bg-black/60",
            "border-blue-900/20",
            "backdrop-blur-xl transition-all duration-300",
            "group"
          )}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader>
              <CardTitle className="font-medium text-zinc-400 text-sm">Daily Revenue Analysis</CardTitle>
              <CardDescription className="text-zinc-500">
                Last 30 days of revenue activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.dailyRevenue} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" opacity={0.2} />
                    <XAxis
                      dataKey="fullDate"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="total"
                      name="Total"
                      fill="url(#barGradient)"
                      radius={[4, 4, 0, 0]}
                      fillOpacity={0.3}
                    />
                    <Bar
                      dataKey="paid"
                      name="Paid"
                      fill="#2563EB"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}