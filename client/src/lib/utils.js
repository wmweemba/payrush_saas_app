import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency values with proper symbols and localization
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (USD, EUR, GBP, etc.)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'USD') {
  const currencyFormatters = {
    USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    EUR: new Intl.NumberFormat('en-EU', { style: 'currency', currency: 'EUR' }),
    GBP: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }),
    ZMW: new Intl.NumberFormat('en-ZM', { style: 'currency', currency: 'ZMW' }),
    NGN: new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }),
    KES: new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }),
    GHS: new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }),
    ZAR: new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }),
  };

  const formatter = currencyFormatters[currency] || currencyFormatters.USD;
  return formatter.format(amount || 0);
}
