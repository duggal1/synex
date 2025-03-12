import { Invoice } from "@prisma/client";

export function generateInvoiceEmailContext(invoice: Invoice, baseUrl: string) {
  return {
    // ... other invoice context variables
    invoiceLink: `${baseUrl}/dashboard/invoices/${invoice.id}`,
    stripePaymentUrl: `${baseUrl}/api/invoices/payment?invoiceId=${invoice.id}`,
    baseUrl,
    // ... other variables
  };
}
