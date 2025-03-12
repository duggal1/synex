"use client";

import { Area, AreaChart, Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/app/utils/formatCurrency";
import { cn } from "@/lib/utils";

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
}

interface RevenueDashboardProps {
  data: RevenueData;
}

export function RevenueDashboard({ data }: RevenueDashboardProps) {
  return (
    <div className="space-y-8">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-black/40 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-500">Overview</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-emerald-500">Analytics</TabsTrigger>
          <TabsTrigger value="daily" className="data-[state=active]:bg-emerald-500">Daily Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-7">
            <Card className={cn(
              "col-span-4",
              "relative overflow-hidden",
              "bg-black/40 hover:bg-black/60",
              "border-zinc-800/30",
              "backdrop-blur-xl transition-all duration-300",
              "group"
            )}>
              <CardHeader>
                <CardTitle className="text-neutral-400 text-sm">Revenue Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.monthlyRevenue}>
                      <defs>
                        <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity={0.8}/>
                          <stop offset="100%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="paidGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#059669" stopOpacity={0.8}/>
                          <stop offset="100%" stopColor="#059669" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
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
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-black/80 shadow-xl backdrop-blur-xl p-4 border rounded-lg">
                                <div className="gap-2 grid">
                                  <p className="font-medium text-neutral-200 text-sm">
                                    {payload[0].payload.name}
                                  </p>
                                  <div className="flex flex-col gap-1">
                                    <div className="flex justify-between items-center gap-2">
                                      <span className="text-[0.70rem] text-neutral-400 uppercase">
                                        Total
                                      </span>
                                      <span className="font-bold text-emerald-400">
                                        {formatCurrency({
                                          amount: payload[0].value as number,
                                          currency: "USD"
                                        })}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center gap-2">
                                      <span className="text-[0.70rem] text-neutral-400 uppercase">
                                        Paid
                                      </span>
                                      <span className="font-bold text-emerald-500">
                                        {formatCurrency({
                                          amount: payload[1].value as number,
                                          currency: "USD"
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#10B981"
                        fillOpacity={1}
                        fill="url(#totalGradient)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="paid"
                        stroke="#059669"
                        fillOpacity={1}
                        fill="url(#paidGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className={cn(
              "col-span-3",
              "relative overflow-hidden",
              "bg-black/40 hover:bg-black/60",
              "border-zinc-800/30",
              "backdrop-blur-xl transition-all duration-300",
              "group"
            )}>
              <CardHeader>
                <CardTitle className="text-neutral-400 text-sm">Payment Methods</CardTitle>
                <CardDescription>
                  Breakdown of payments by method
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {data.paymentMethodsData.map((method) => (
                    <div key={method.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">{method.name}</p>
                          <p className="text-neutral-500 text-xs">
                            {method.count} total payments ({method.recentCount} recent)
                          </p>
                        </div>
                        <span className="font-medium text-emerald-500 text-sm">
                          {formatCurrency({
                            amount: method.value,
                            currency: "USD"
                          })}
                        </span>
                      </div>
                      <div className="relative bg-zinc-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="left-0 absolute inset-y-0 bg-emerald-500 transition-all duration-500 ease-out"
                          style={{
                            width: `${(method.value / data.totalPaid) * 100}%`,
                          }}
                        />
                        <div
                          className="absolute inset-y-0 bg-emerald-300/50 transition-all duration-500 ease-out"
                          style={{
                            left: `${(method.value / data.totalPaid) * 100}%`,
                            width: `${(method.recentCount / method.count) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="gap-4 grid md:grid-cols-2 lg:grid-cols-2">
            <Card className={cn(
              "relative overflow-hidden",
              "bg-black/40 hover:bg-black/60",
              "border-zinc-800/30",
              "backdrop-blur-xl transition-all duration-300",
              "group"
            )}>
              <CardHeader>
                <CardTitle className="text-neutral-400 text-sm">Payment Success Rate</CardTitle>
                <CardDescription>
                  Percentage of invoices that get paid
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col justify-center items-center space-y-4">
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full -rotate-90 transform">
                      <circle
                        className="stroke-zinc-800"
                        strokeWidth="12"
                        cx="80"
                        cy="80"
                        r="60"
                        fill="transparent"
                      />
                      <circle
                        className="stroke-emerald-500 transition-all duration-1000 ease-in-out"
                        strokeWidth="12"
                        strokeDasharray={`${data.totalPaymentRate * 3.77}, 377`}
                        strokeLinecap="round"
                        cx="80"
                        cy="80"
                        r="60"
                        fill="transparent"
                      >
                        <animate
                          attributeName="stroke-dasharray"
                          from="0, 377"
                          to={`${data.totalPaymentRate * 3.77}, 377`}
                          dur="1.5s"
                          fill="freeze"
                          calcMode="spline"
                          keySplines="0.4 0 0.2 1"
                        />
                      </circle>
                    </svg>
                    <div className="absolute inset-0 flex justify-center items-center">
                      <div className="text-center">
                        <p className="font-bold text-emerald-500 text-3xl">{data.totalPaymentRate}%</p>
                        <p className="text-neutral-500 text-xs">Success Rate</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-neutral-400 text-sm">
                      Average {data.averageDaysToPayment} days to payment
                    </p>
                    <p className="mt-1 text-neutral-500 text-xs">
                      {formatCurrency({ amount: data.totalPaid, currency: "USD" })} collected
                      <br />
                      out of {formatCurrency({ amount: data.totalRevenue, currency: "USD" })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={cn(
              "relative overflow-hidden",
              "bg-black/40 hover:bg-black/60",
              "border-zinc-800/30",
              "backdrop-blur-xl transition-all duration-300",
              "group"
            )}>
              <CardHeader>
                <CardTitle className="text-neutral-400 text-sm">Daily Average</CardTitle>
                <CardDescription>
                  Revenue trends and daily performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-emerald-500 rounded-full w-2 h-2" />
                      <p className="font-medium text-sm">Current Average</p>
                    </div>
                    <p className="font-bold text-emerald-500 text-2xl">
                      {formatCurrency({ amount: data.dailyAverage, currency: "USD" })}
                    </p>
                    <p className="text-neutral-500 text-xs">
                      per day this month
                    </p>
                  </div>
                  <div className="h-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.dailyRevenue.slice(-14)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
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
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-black/80 shadow-xl p-2 border rounded-lg">
                                  <p className="font-medium text-neutral-200 text-xs">
                                    {payload[0].payload.fullDate}
                                  </p>
                                  <p className="font-bold text-emerald-500 text-xs">
                                    {formatCurrency({
                                      amount: payload[0].value as number,
                                      currency: "USD"
                                    })}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="paid"
                          stroke="#10B981"
                          strokeWidth={2}
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

        <TabsContent value="daily" className="space-y-4">
          <Card className={cn(
            "relative overflow-hidden",
            "bg-black/40 hover:bg-black/60",
            "border-zinc-800/30",
            "backdrop-blur-xl transition-all duration-300",
            "group"
          )}>
            <CardHeader>
              <CardTitle className="text-neutral-400 text-sm">Daily Revenue Breakdown</CardTitle>
              <CardDescription>
                Last 30 days of revenue activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.dailyRevenue} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
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
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-black/80 shadow-xl backdrop-blur-xl p-4 border rounded-lg">
                              <p className="font-medium text-neutral-200">
                                {payload[0].payload.fullDate}
                              </p>
                              <div className="space-y-1 mt-2">
                                <div className="flex justify-between items-center gap-8">
                                  <span className="text-neutral-400 text-xs">Total</span>
                                  <span className="font-medium text-emerald-400">
                                    {formatCurrency({
                                      amount: payload[0].value as number,
                                      currency: "USD"
                                    })}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center gap-8">
                                  <span className="text-neutral-400 text-xs">Paid</span>
                                  <span className="font-medium text-emerald-500">
                                    {formatCurrency({
                                      amount: payload[1].value as number,
                                      currency: "USD"
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="total"
                      fill="#10B981"
                      radius={[4, 4, 0, 0]}
                      fillOpacity={0.3}
                    />
                    <Bar
                      dataKey="paid"
                      fill="#059669"
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
