export type CurrencyType = "USD" | "EUR";

export interface FormattedCurrency {
  amount: number;
  currency: CurrencyType;
}