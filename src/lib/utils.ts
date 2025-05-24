import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Updated currency formatting utility
export function formatCurrency(
  amount: number,
  locale: string = 'en-US',
  currency: string = 'USD'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  } catch (error) {
    console.warn(`Currency formatting error for locale "${locale}" and currency "${currency}":`, error);
    // Fallback formatting for unsupported currencies by Intl or errors
    return `${currency} ${amount.toFixed(2)}`;
  }
}
