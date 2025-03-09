"use client";

import { useState, useEffect } from "react";
import { ChartContainer } from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { formatCurrency } from "../utils/formatCurrency";
import { cn } from "@/lib/utils";

interface GraphProps {
  data: {
    date: string;
    totalAmount: number;
    paidAmount: number;
    unpaidAmount: number;
  }[];
}

export function Graph({ data }: GraphProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  const [hoveredData, setHoveredData] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const chartConfig = {
    total: {
      label: "Total Revenue",
      color: "#3B82F6"
    },
    paid: {
      label: "Paid Amount",
      color: "#10B981"
    },
    unpaid: {
      label: "Pending Amount",
      color: "#F43F5E"
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={cn(
          "bg-black/80 backdrop-blur-xl",
          "border border-white/10",
          "rounded-lg shadow-2xl",
          "p-4",
          "transition-all duration-200",
          "animate-in fade-in-50 slide-in-from-bottom-1",
        )}>
          <p className="mb-3 font-medium text-white/60 text-sm">{label}</p>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-3">
                <div 
                  className={cn(
                    "size-2 rounded-full",
                    "ring-2 ring-white/10 ring-offset-1 ring-offset-black/80"
                  )}
                  style={{ backgroundColor: entry.color }}
                />
                <span className="min-w-24 text-white/60 text-sm">{entry.name}:</span>
                <span className="font-medium tabular-nums text-white text-sm">
                  {formatCurrency({ amount: entry.value, currency: "USD" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ChartContainer className="mt-4 h-[400px]" config={chartConfig}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
          onMouseMove={(data) => setHoveredData(data)}
          onMouseLeave={() => setHoveredData(null)}
        >
          <defs>
            <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="paidGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="unpaidGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="rgba(255,255,255,0.03)"
            vertical={false}
          />

          <XAxis
            dataKey="date"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            dy={10}
          />

          <YAxis
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value}`}
            dx={-10}
          />

          <Tooltip 
            content={<CustomTooltip />}
            cursor={{
              stroke: "rgba(255,255,255,0.05)",
              strokeWidth: 1,
              strokeDasharray: "4 4"
            }}
          />

          <Area
            type="monotone"
            dataKey="totalAmount"
            name="Total"
            stroke="#3B82F6"
            fill="url(#totalGradient)"
            strokeWidth={2}
            isAnimationActive={isAnimating}
            animationDuration={2000}
            animationEasing="ease"
            dot={false}
            activeDot={{
              r: 4,
              stroke: '#3B82F6',
              strokeWidth: 2,
              fill: '#000',
              className: "animate-pulse"
            }}
          />

          <Area
            type="monotone"
            dataKey="paidAmount"
            name="Paid"
            stroke="#10B981"
            fill="url(#paidGradient)"
            strokeWidth={2}
            isAnimationActive={isAnimating}
            animationDuration={2000}
            animationEasing="ease"
            dot={false}
            activeDot={{
              r: 4,
              stroke: '#10B981',
              strokeWidth: 2,
              fill: '#000',
              className: "animate-pulse"
            }}
          />

          <Area
            type="monotone"
            dataKey="unpaidAmount"
            name="Pending"
            stroke="#F43F5E"
            fill="url(#unpaidGradient)"
            strokeWidth={2}
            isAnimationActive={isAnimating}
            animationDuration={2000}
            animationEasing="ease"
            dot={false}
            activeDot={{
              r: 4,
              stroke: '#F43F5E',
              strokeWidth: 2,
              fill: '#000',
              className: "animate-pulse"
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}