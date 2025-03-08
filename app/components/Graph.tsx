/* eslint-disable react/no-children-prop */
"use client";

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { useState, useEffect, useRef } from "react";

interface iAppProps {
  data: {
    date: string;
    amount: number;
  }[];
}

export function Graph({ data }: iAppProps) {
  const [animationProgress, setAnimationProgress] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  // Fix: Initialize useRef with null
  const animationRef = useRef<number | null>(null);
  
  // Ensure we have data to work with
  const safeData = data && data.length > 0 ? data : [
    { date: "Jan 1", amount: 0 },
    { date: "Jan 2", amount: 0 }
  ];
  
  // Calculate the maximum value for better scaling
  const maxValue = Math.max(...safeData.map(item => item.amount)) * 1.1 || 100;
  
  // Create data with animation progress
  const animatedData = safeData.slice(0, Math.max(1, Math.ceil(safeData.length * animationProgress)));
  
  // Handle animation
  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 2000; // 2 seconds
    
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      
      setAnimationProgress(progress);
      
      if (progress < 1 && !isHovering) {
        animationRef.current = requestAnimationFrame(step);
      }
    };
    
    // Start animation
    animationRef.current = requestAnimationFrame(step);
    
    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [safeData.length, isHovering]);
  
  return (
    <div 
      className="relative w-full rounded-xl border bg-card overflow-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
      
      <div className="px-4 pt-4 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-medium">Revenue Growth</h3>
          {safeData.length > 0 && (
            <p className="text-2xl font-bold">
              ${safeData[safeData.length - 1].amount.toLocaleString()}
            </p>
          )}
        </div>
        
        {/* Animated status indicator */}
        <div className="flex items-center">
          <span className={`mr-2 h-2 w-2 rounded-full ${
            animationProgress === 1 ? 'bg-green-500' : 'bg-primary animate-pulse'
          }`}></span>
          <span className="text-xs text-muted-foreground">
            {animationProgress === 1 ? 'Data loaded' : 'Loading data...'}
          </span>
        </div>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
        <ChartContainer
      config={{
        type: "line",
        width: 100,
        height: 100,
        margin: { top: 20, right: 20, left: 0, bottom: 10 }
      }}
    >
          <LineChart data={animatedData} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--background))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              dx={-10}
              domain={[0, maxValue]}
            />
            <ChartTooltip 
              cursor={false}
              content={
                <ChartTooltipContent 
                  indicator="line" 
                  className="bg-card/90 border border-primary/20 backdrop-blur-xl p-2 rounded-lg shadow-lg" 
                />
              } 
            />
            
            {/* Area fill under the line */}
            <Area
              type="monotone"
              dataKey="amount"
              stroke="none"
              fill="url(#splitColor)"
              isAnimationActive={false}
            />
            
            {/* Path shadow effect */}
            <Line
              type="monotone"
              dataKey="amount"
              stroke="hsl(var(--primary))"
              strokeWidth={8}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
              strokeOpacity={0.1}
              style={{ filter: "blur(8px)" }}
            />
            
            {/* Primary line */}
            <Line
              type="monotone"
              dataKey="amount"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={false}
              activeDot={{ 
                r: 6, 
                fill: "hsl(var(--primary))",
                strokeWidth: 3,
                stroke: "hsl(var(--background))",
                filter: "drop-shadow(0 0 4px rgba(56, 89, 255, 0.5))"
              }}
              isAnimationActive={false}
            />
          </LineChart>
          </ChartContainer>
        </ResponsiveContainer>
      </div>
      
      {/* Growth indicator */}
      {safeData.length > 1 && animationProgress === 1 && (
        <div className="px-4 pb-4 flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            {safeData[0].date}
          </div>
          <div className="text-sm">
            <span className={`font-medium ${
              safeData[safeData.length - 1].amount > safeData[0].amount 
                ? 'text-green-500' 
                : 'text-red-500'
            }`}>
              {safeData[safeData.length - 1].amount > safeData[0].amount ? '↑' : '↓'} 
              {safeData[0].amount > 0 
                ? Math.abs(Math.round((safeData[safeData.length - 1].amount - safeData[0].amount) / safeData[0].amount * 100))
                : 0}%
            </span>
            <span className="text-muted-foreground ml-1">from {safeData[0].date}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {safeData[safeData.length - 1].date}
          </div>
        </div>
      )}
    </div>
  );
}