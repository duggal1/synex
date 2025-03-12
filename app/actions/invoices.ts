'use server';

import prisma from "@/app/utils/db";
import { InvoiceStatus, PaymentMethod } from "@prisma/client";

export interface Invoice {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  paidAt?: string;
  paymentMethod?: string;
  currency?: string;
}

export async function getInvoices(): Promise<Invoice[]> {
  const invoices = await prisma.invoice.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      id: true,
      total: true,
      status: true,
      createdAt: true,
      paidAt: true,
      paymentMethod: true,
      currency: true
    }
  });
  
  // Convert Prisma types to our interface types
  return invoices.map(invoice => ({
    id: invoice.id,
    total: invoice.total,
    status: invoice.status.toLowerCase(),
    createdAt: invoice.createdAt.toISOString(),
    paidAt: invoice.paidAt?.toISOString(),
    paymentMethod: invoice.paymentMethod?.toLowerCase() || undefined,
    currency: invoice.currency || undefined
  }));
} 