import type { MoneyValue } from "./types";

export const toNumber = (value: MoneyValue | null | undefined): number => {
  if (typeof value === "number") {
    return value;
  }

  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatCurrency = (
  value: MoneyValue | null | undefined,
  currency = "USD",
): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(toNumber(value));
