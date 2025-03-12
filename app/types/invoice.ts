import { CurrencyType } from './currency';

export interface InvoiceData {
  id: string;
  invoiceName: string;
  invoiceNumber: number;
  currency: CurrencyType;
  fromName: string;
  fromEmail: string;
  fromAddress: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  date: Date;
  dueDate: number;
  invoiceItemDescription: string;
  invoiceItemQuantity: number;
  invoiceItemRate: number;
  total: number;
  note?: string | null;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  paymentMethod?: 'EMAIL' | 'STRIPE' | 'MANUAL' | null;
  stripeCheckoutSessionId?: string | null;
  paymentLink?: string | null;
}

// Helper function to ensure non-null values
export function ensureNonNull<T>(value: T | null | undefined, defaultValue: T): T {
  return value ?? defaultValue;
}
