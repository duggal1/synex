import type { CurrencyType, FormattedCurrency } from "../types/currency";

export function formatCurrency({ 
  amount, 
  currency = "USD" 
}: Partial<FormattedCurrency> & { amount: number }): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency as CurrencyType,
    minimumFractionDigits: 2,
  }).format(amount);
}
