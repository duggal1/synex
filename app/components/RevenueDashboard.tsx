"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/app/utils/formatCurrency";
import dynamic from "next/dynamic";

// Dynamically import recharts components to avoid SSR issues
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false });
const PieChart = dynamic(() => import("recharts").then((mod) => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then((mod) => mod.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell), { ssr: false });
const Legend = dynamic(() => import("recharts").then((mod) => mod.Legend), { ssr: false });

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'];

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

export function RevenueDashboard({ data }: { data: RevenueData }) {
  return (
    <Tabs defaultValue="monthly" className="space-y-4">
      <TabsList>
        <TabsTrigger value="monthly">Monthly Revenue</TabsTrigger>
        <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
      </TabsList>
      <TabsContent value="monthly" className="space-y-4">
        <Card className="bg-black/40 backdrop-blur-sm border-neutral-800/50">
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>
              Your revenue over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.monthlyRevenue}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#888" />
                  <YAxis 
                    stroke="#888"
                    tickFormatter={(value) => 
                      formatCurrency({ amount: value, currency: "USD", showSymbol: false })
                    }
                  />
                  <Tooltip 
                    formatter={(value: number) => 
                      formatCurrency({ amount: value, currency: "USD" })
                    }
                  />
                  <Legend />
                  <Bar dataKey="total" name="Total" fill="#8884d8" />
                  <Bar dataKey="paid" name="Paid" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="payment-methods" className="space-y-4">
        <Card className="bg-black/40 backdrop-blur-sm border-neutral-800/50">
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>
              Breakdown of revenue by payment method
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.paymentMethodsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.paymentMethodsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => 
                      formatCurrency({ amount: value, currency: "USD" })
                    }
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 