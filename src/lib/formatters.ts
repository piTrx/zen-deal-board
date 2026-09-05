import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";

export const DEFAULT_CURRENCY = "EUR";

const localeByCurrency: Record<string, string> = {
  EUR: "es-ES",
  USD: "en-US",
  GBP: "en-GB",
  CHF: "de-CH",
  MXN: "es-MX",
};

// Currency of the current account/workspace. Updated at runtime by useCurrencySync().
let activeCurrency = DEFAULT_CURRENCY;

export function setActiveCurrency(currency: string | null | undefined) {
  activeCurrency = currency || DEFAULT_CURRENCY;
}

export function getActiveCurrency() {
  return activeCurrency;
}

export function getCurrencySymbol(currency: string = activeCurrency): string {
  const parts = new Intl.NumberFormat(localeByCurrency[currency] || "es-ES", {
    style: "currency",
    currency,
  }).formatToParts(0);
  return parts.find((p) => p.type === "currency")?.value || "€";
}

export function formatCurrency(value: number, currency: string = activeCurrency): string {
  return new Intl.NumberFormat(localeByCurrency[currency] || "es-ES", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactCurrency(value: number, currency: string = activeCurrency): string {
  return `${new Intl.NumberFormat(localeByCurrency[currency] || "es-ES", {
    maximumFractionDigits: 0,
  }).format(Math.round(value / 1000))} k${getCurrencySymbol(currency)}`;
}

export function formatRelativeDate(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), "d MMM yyyy", { locale: es });
}
