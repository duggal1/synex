import { CurrencyType, FormattedCurrency } from "./types";

export function formatCurrency({ amount, currency }: FormattedCurrency): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
