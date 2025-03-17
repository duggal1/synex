"use client";

import { cn } from "@/lib/utils";
import { HomeIcon, Users2, DollarSign, Settings, ZapIcon, FileEdit, SparkleIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UsageProgress } from "./UsageProgress";
import { requireUser } from "../utils/hooks";

export const dashboardLinks = [
  {
    id: 0,
    name: "Dashboard",
    href: "/dashboard",
    icon: HomeIcon,
    color: "text-neutral-200",
  },
  {
    id: 1,
    name: "Invoices",
    href: "/dashboard/invoices",
    icon: Users2,
    color: "text-orange-500",
  },
  {
    id: 2,
    name: "Agentic(Beta)",
    href: "/dashboard/Agentic",
    icon: SparkleIcon,
    color: "text-blue-600",
  },
  {
    id: 3,
    name: "Revenue",
    href: "/dashboard/revenue",
    icon: DollarSign,
    color: "text-green-600",
  },
  {
    id: 4,
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    color: "text-gray-400",
  },
  {
    id: 5,
    name: "Upgrade",
    href: "/dashboard/upgrade",
    icon: ZapIcon,
    color: "text-purple-600",
  },
  {
    id: 6,
    name: "Invoice Builder",
    href: "/dashboard/invoice-builder",
    icon: FileEdit,
    color: "text-red-500",
  },
];

interface DashboardLinksProps {
  invoiceCount?: number;
  maxInvoices?: number;
  isSubscribed?: boolean;
}

export function DashboardLinks({ 
  invoiceCount = 0, 
  maxInvoices = 5, 
  isSubscribed = false 
}: DashboardLinksProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-1">
        {dashboardLinks.map((link) => (
          <Link
            className={cn(
              pathname === link.href
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground",
              "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary"
            )}
            href={link.href}
            key={link.id}
          >
            <link.icon className={cn("size-4", link.color)} />
            {link.name}
          </Link>
        ))}
      </div>

    
      <UsageProgress
  invoiceCount={invoiceCount}
  isSubscribed={isSubscribed}
/>

    </div>
  );
}