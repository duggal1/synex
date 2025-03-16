import type { CurrencyType, FormattedCurrency } from "../types/currency";

export function formatCurrency({ 
  amount, 
  currency = "USD" 
}: { 
  amount: number;
  currency?: CurrencyType;
}): string {
  // Ensure currency is always USD or EUR
  const validCurrency = currency === "EUR" ? "EUR" : "USD";
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: validCurrency,
    minimumFractionDigits: 2,
  }).format(amount);
}
