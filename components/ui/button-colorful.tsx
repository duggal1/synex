import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

interface ButtonColorfulProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
}

export function ButtonColorful({
  className,
  label = "Explore Components",
  ...props
}: ButtonColorfulProps) {
  return (
    <Button
      className={cn(
        "relative overflow-hidden",
        "bg-transparent",
        "transition-all duration-300",
        "hover:scale-105",
        "group",
        "border-0",
        className
      )}
      {...props}
    >
      {/* Base gradient background */}
      <div
        className={cn(
          "absolute inset-0",
          "bg-gradient-to-r from-blue-600 via-violet-600 to-blue-600 ",
          "opacity-80 group-hover:opacity-100",
          "transition-all duration-500"
        )}
      />
      {/* Glow effect */}
      <div
        className={cn(
          "absolute inset-0",
          "bg-gradient-to-r from-violet-600/50 via-pink-600/50 to-blue-600/50",
          "blur-xl group-hover:blur-2xl",
          "opacity-50 group-hover:opacity-70",
          "transition-all duration-500"
        )}
      />
      {/* Shine effect */}
      <div
        className={cn(
          "absolute inset-0",
          "bg-gradient-to-r from-transparent via-white/30 to-transparent",
          "translate-x-[-100%] group-hover:translate-x-[100%]",
          "transition-transform duration-1000"
        )}
      />
      {/* Content */}
      <div className="relative flex justify-center items-center gap-2 px-6 py-3">
        <span className="font-semibold text-white">{label}</span>
        <ArrowUpRight className="w-4 h-4 text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </Button>
  );
}