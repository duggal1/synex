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
    <>
      {data.length === 0 ? (
        <EmptyState
          title="No invoices found"
          description="Create an invoice to get started"
          buttontext="Create invoice"
          href="/dashboard/invoices/create"
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>#{invoice.invoiceNumber}</TableCell>
                <TableCell>{invoice.clientName}</TableCell>
                <TableCell>
                  {formatCurrency({
                    amount: invoice.total,
                    currency: invoice.currency as any,
                  })}
                </TableCell>
                <TableCell>
                  <Badge>{invoice.status}</Badge>
                </TableCell>
                <TableCell>
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
      )}
    </>
  );
}
