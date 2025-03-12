export enum CurrencyType {
    USD = "USD",
    EUR = "EUR"
  }
  
  export interface FormattedCurrency {
    amount: number;
    currency: CurrencyType;
  }