import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Graph } from "./Graph";
import prisma from "../utils/db";
import { requireUser } from "../utils/hooks";
import { formatCurrency } from "../utils/formatCurrency";
import { cn } from "@/lib/utils";

async function getInvoices(userId: string) {
  const rawData = await prisma.invoice.findMany({
    where: {
      userId: userId,
      OR: [
        {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        {
          paidAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      ],
    },
    select: {
      createdAt: true,
      paidAt: true,
      total: true,
      status: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const allDates: { [key: string]: { totalAmount: number; paidAmount: number; unpaidAmount: number } } = {};

  // Initialize all dates
  for (let d = new Date(sevenDaysAgo); d <= tomorrow; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    allDates[dateStr] = { totalAmount: 0, paidAmount: 0, unpaidAmount: 0 };
  }

  // Process invoices
  rawData.forEach((invoice) => {
    const createdDateStr = invoice.createdAt.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    
    if (allDates[createdDateStr]) {
      allDates[createdDateStr].totalAmount += invoice.total;
      
      // If invoice is pending, add to unpaid amount on creation date
      if (invoice.status === "PENDING") {
        allDates[createdDateStr].unpaidAmount += invoice.total;
      }
    }

    // If invoice is paid, add to paid amount on the payment date or creation date
    if (invoice.status === "PAID") {
      const paidDateStr = (invoice.paidAt || invoice.createdAt).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      
      if (allDates[paidDateStr]) {
        allDates[paidDateStr].paidAmount += invoice.total;
      }
    }
  });

  return Object.entries(allDates)
    .map(([date, amounts]) => ({
      date,
      ...amounts,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function InvoiceGraph() {
  const session = await requireUser();
  const data = await getInvoices(session.user?.id as string);

  return (
    <Card className={cn(
      "col-span-2 lg:col-span-2 w-full",
      "bg-black/40 backdrop-blur-sm",
      "border border-neutral-800/50",
      "animate-fade-in-up"
    )}>
      <CardHeader>
        <CardTitle className="font-medium text-xl tracking-wide">
          Revenue Overview
        </CardTitle>
        <CardDescription className="text-neutral-400">
          Track your revenue trends over the past 7 days
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[400px]">
        <Graph data={data} />
      </CardContent>
    </Card>
  );
}