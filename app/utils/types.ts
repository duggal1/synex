import { z } from "zod";
import type { SubscriptionPlan, PaymentStatus } from "@prisma/client";
import { SubmissionResult } from "@conform-to/react";

export type CurrencyType = "USD" | "EUR";

export interface BaseActionResult {
  success: boolean;
  error?: string;
  hasSubscription?: boolean;
}

export interface CreateInvoiceResponse extends BaseActionResult {
  invoiceId?: string;
}

export interface CheckInvoiceLimitResult extends BaseActionResult {
  shouldUpgrade?: boolean;
  message?: string;
  plan?: SubscriptionPlan;
}

// This is what your form actions will return
export type FormResult = SubmissionResult | CreateInvoiceResponse;

export interface SubscriptionData {
  planType: SubscriptionPlan | "FREE";
  status: PaymentStatus | "INACTIVE";
  currentPeriodEnd?: Date | null;
}

export interface FormattedCurrency {
  amount: number;
  currency: CurrencyType;
}

export type ActionHandler = (formData: FormData) => Promise<FormResult>;
export type ActionState = (state: FormResult | null) => Promise<FormResult>;
