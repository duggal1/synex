"use client";

import { cn } from "@/lib/utils";
import { HomeIcon, Users2, DollarSign, Settings, ZapIcon, FileEdit, SparkleIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const dashboardLinks = [
  {
    id: 0,
    name: "Dashboard",
    href: "/dashboard",
    icon: HomeIcon,
    color: "text-blue-500",
  },
  {
    id: 1,
    name: "Invoices",
    href: "/dashboard/invoices",
    icon: Users2,
    color: "text-green-500",
  },
  {
    id: 2,
    name: "Agentic(Beta)",
    href: "/dashboard/Agentic",
    icon: SparkleIcon,
    color: "text-indigo-500",
  },
  {
    id: 3,
    name: "Revenue",
    href: "/dashboard/revenue",
    icon: DollarSign,
    color: "text-yellow-600",
  },
  {
    id: 4,
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    color: "text-gray-500",
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

export function DashboardLinks() {
  const pathname = usePathname();
  return (
    <>
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
    </>
  );
}