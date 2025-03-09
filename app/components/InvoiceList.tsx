import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InvoiceActions } from "./InvoiceActions";
import prisma from "../utils/db";
import { requireUser } from "../utils/hooks";
import { formatCurrency } from "../utils/formatCurrency";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "./EmptyState";
import { cn } from "@/lib/utils";

async function getData(userId: string) {
  const data = await prisma.invoice.findMany({
    where: {
      userId: userId,
    },
    select: {
      id: true,
      clientName: true,
      total: true,
      createdAt: true,
      status: true,
      invoiceNumber: true,
      currency: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return data;
}
export async function InvoiceList() {
  const session = await requireUser();
  const data = await getData(session.user?.id as string);
  
  return (
    <div className="animate-fade-in-up">
      {data.length === 0 ? (
        <EmptyState
          title="No invoices found"
          description="Create an invoice to get started"
          buttontext="Create invoice"
          href="/dashboard/invoices/create"
        />
      ) : (
        <div className="bg-black/40 backdrop-blur-sm border border-neutral-800/50 rounded-xl">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-neutral-800/50">
                <TableHead className="font-normal text-neutral-400">Invoice ID</TableHead>
                <TableHead className="font-normal text-neutral-400">Customer</TableHead>
                <TableHead className="font-normal text-neutral-400">Amount</TableHead>
                <TableHead className="font-normal text-neutral-400">Status</TableHead>
                <TableHead className="font-normal text-neutral-400">Date</TableHead>
                <TableHead className="font-normal text-neutral-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((invoice, index) => (
                <TableRow 
                  key={invoice.id}
                  className={cn(
                    "border-neutral-800/50",
                    "hover:bg-black/60 transition-colors duration-200",
                    "animate-fade-in-up",
                    `delay-${index * 50}`
                  )}
                >
                  <TableCell className="font-medium text-sm">
                    #{invoice.invoiceNumber}
                  </TableCell>
                  <TableCell className="text-neutral-300">
                    {invoice.clientName}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency({
                      amount: invoice.total,
                      currency: invoice.currency as any,
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        invoice.status === 'PAID' && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                        invoice.status === 'PENDING' && "bg-orange-500/10 text-red-600 border-orange-500/20",
                       // invoice.status === 'OVERDUE' && "bg-red-500/10 text-red-500 border-red-500/20"
                      )}
                    >
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-neutral-400 text-sm">
                    {new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                    }).format(invoice.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <InvoiceActions status={invoice.status} id={invoice.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
