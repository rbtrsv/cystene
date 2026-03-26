/**
 * Currency formatting utilities
 */

// Common currency symbols mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  'USD': '$',
  'EUR': '€', 
  'GBP': '£',
  'JPY': '¥',
  'CHF': 'CHF',
  'CAD': 'C$',
  'AUD': 'A$',
  'CNY': '¥',
  'INR': '₹',
  'BRL': 'R$',
  'RON': 'lei',
};

/**
 * Format currency amount with proper locale and currency code
 */
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  try {
    // Use Intl.NumberFormat for proper locale-aware formatting
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback if currency is not supported by Intl.NumberFormat
    const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] || currency.toUpperCase();
    return `${symbol}${amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }
}

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] || currency.toUpperCase();
}

/**
 * Format currency for display in tables (shorter format)
 */
export function formatCurrencyCompact(amount: number, currency: string = 'EUR'): string {
  const formatted = formatCurrency(amount, currency);
  
  // For large amounts, show in K/M format
  if (Math.abs(amount) >= 1000000) {
    const millions = amount / 1000000;
    return `${getCurrencySymbol(currency)}${millions.toFixed(1)}M`;
  } else if (Math.abs(amount) >= 1000) {
    const thousands = amount / 1000;
    return `${getCurrencySymbol(currency)}${thousands.toFixed(1)}K`;
  }
  
  return formatted;
}

/**
 * Parse currency string to number (removes currency symbols and formatting)
 */
export function parseCurrencyToNumber(currencyString: string): number {
  // Remove currency symbols and spaces, keep only digits, decimal point, and minus sign
  const cleanedString = currencyString.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleanedString);
  return isNaN(parsed) ? 0 : parsed;
}
