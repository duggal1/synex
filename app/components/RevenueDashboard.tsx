"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/app/utils/formatCurrency";
import { cn } from "@/lib/utils";

interface RevenueData {
  monthlyRevenue: Array<{
    name: string;
    total: number;
    paid: number;
  }>;
  paymentMethodsData: Array<{
    name: string;
    value: number;
    count: number;
  }>;
  currentMonthTotal: number;
  currentMonthPaid: number;
  paymentRate: number;
  totalRevenue: number;
  totalPaid: number;
  totalPaymentRate: number;
  averageInvoiceValue: number;
}

interface RevenueDashboardProps {
  data: RevenueData;
}

export function RevenueDashboard({ data }: RevenueDashboardProps) {
  return (
    <div className="space-y-8">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-black/40">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.monthlyRevenue}>
                      <XAxis
                        dataKey="name"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
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
                              <div className="bg-background shadow-sm p-2 border rounded-lg">
                                <div className="gap-2 grid grid-cols-2">
                                  <div className="flex flex-col">
                                    <span className="text-[0.70rem] text-muted-foreground uppercase">
                                      Total
                                    </span>
                                    <span className="font-bold text-muted-foreground">
                                      {formatCurrency({
                                        amount: payload[0].value as number,
                                        currency: "USD"
                                      })}
                                    </span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[0.70rem] text-muted-foreground uppercase">
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
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="total"
                        fill="currentColor"
                        radius={[4, 4, 0, 0]}
                        className="fill-primary/30"
                      />
                      <Bar
                        dataKey="paid"
                        fill="currentColor"
                        radius={[4, 4, 0, 0]}
                        className="fill-emerald-500"
                      />
                    </BarChart>
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
                <div className="space-y-4">
                  {data.paymentMethodsData.map((method) => (
                    <div key={method.name} className="flex items-center">
                      <div className="w-full">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-medium text-sm">{method.name}</p>
                          <span className="text-muted-foreground text-sm">
                            {formatCurrency({
                              amount: method.value,
                              currency: "USD"
                            })}
                          </span>
                        </div>
                        <div className="relative bg-zinc-800 rounded-full w-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full transition-all"
                            style={{
                              width: `${(method.value / data.totalPaid) * 100}%`,
                            }}
                          />
                        </div>
                        <p className="mt-2 text-muted-foreground text-xs">
                          {method.count} payments
                        </p>
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
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle
                        className="stroke-zinc-800"
                        strokeWidth="12"
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                      />
                      <circle
                        className="stroke-emerald-500 transition-all duration-300"
                        strokeWidth="12"
                        strokeDasharray={`${data.totalPaymentRate * 2.51}, 251`}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute inset-0 flex justify-center items-center">
                      <p className="font-bold text-2xl">{data.totalPaymentRate}%</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {formatCurrency({ amount: data.totalPaid, currency: "USD" })} collected
                    out of {formatCurrency({ amount: data.totalRevenue, currency: "USD" })}
                  </p>
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
                <CardTitle className="text-neutral-400 text-sm">Recent Activity</CardTitle>
                <CardDescription>
                  Last 7 days of payment activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="gap-2 grid">
                    <div className="flex items-center">
                      <div className="bg-emerald-500 mr-2 rounded-full w-2 h-2" />
                      <p className="font-medium text-sm">Current Week</p>
                    </div>
                    <p className="font-bold text-2xl">
                      {formatCurrency({ amount: data.currentMonthPaid, currency: "USD" })}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {data.paymentRate}% payment rate this month
                    </p>
                  </div>
                  <div className="h-[60px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.monthlyRevenue.slice(-7)}>
                        <Bar
                          dataKey="paid"
                          fill="currentColor"
                          radius={[4, 4, 0, 0]}
                          className="fill-emerald-500"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
