"use client";

import { cn } from "@/lib";
import { ButtonHTMLAttributes } from "react";

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

export const GradientButton = ({ className, children, ...props }: GradientButtonProps) => {
  return (
    <button
      className={cn(
        "relative w-full px-6 py-3 text-white font-black rounded-lg overflow-hidden transition-all",
        "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600",
        "hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500",
        "animate-gradient-shine",
        "shadow-[0_0_20px_2px_rgba(79,70,229,0.4)]",
        "hover:shadow-[0_0_40px_2px_rgba(79,70,229,0.6)]",
        "hover:scale-[1.02] hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 w-full h-full animate-gradient opacity-50" />
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
};
