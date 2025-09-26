/**
 * Multi-Currency Configuration for PayRush
 * Supports ZMW (Zambian Kwacha) and other major currencies
 */

export const SUPPORTED_CURRENCIES = {
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    decimal_places: 2,
    thousand_separator: ',',
    decimal_separator: '.',
    symbol_position: 'before', // before or after
    supported_payment_methods: ['card', 'mobile_money', 'bank_transfer', 'ussd'],
    flutterwave_supported: true,
    country: 'United States',
    flag: '🇺🇸'
  },
  ZMW: {
    code: 'ZMW',
    name: 'Zambian Kwacha',
    symbol: 'K',
    decimal_places: 2,
    thousand_separator: ',',
    decimal_separator: '.',
    symbol_position: 'before',
    supported_payment_methods: ['card', 'mobile_money', 'bank_transfer', 'ussd'],
    flutterwave_supported: true,
    country: 'Zambia',
    flag: '🇿🇲'
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    decimal_places: 2,
    thousand_separator: ',',
    decimal_separator: '.',
    symbol_position: 'before',
    supported_payment_methods: ['card', 'bank_transfer'],
    flutterwave_supported: true,
    country: 'European Union',
    flag: '🇪🇺'
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    decimal_places: 2,
    thousand_separator: ',',
    decimal_separator: '.',
    symbol_position: 'before',
    supported_payment_methods: ['card', 'bank_transfer'],
    flutterwave_supported: true,
    country: 'United Kingdom',
    flag: '🇬🇧'
  },
  NGN: {
    code: 'NGN',
    name: 'Nigerian Naira',
    symbol: '₦',
    decimal_places: 2,
    thousand_separator: ',',
    decimal_separator: '.',
    symbol_position: 'before',
    supported_payment_methods: ['card', 'mobile_money', 'bank_transfer', 'ussd'],
    flutterwave_supported: true,
    country: 'Nigeria',
    flag: '🇳🇬'
  },
  KES: {
    code: 'KES',
    name: 'Kenyan Shilling',
    symbol: 'KSh',
    decimal_places: 2,
    thousand_separator: ',',
    decimal_separator: '.',
    symbol_position: 'before',
    supported_payment_methods: ['card', 'mobile_money', 'bank_transfer'],
    flutterwave_supported: true,
    country: 'Kenya',
    flag: '🇰🇪'
  },
  GHS: {
    code: 'GHS',
    name: 'Ghanaian Cedi',
    symbol: '₵',
    decimal_places: 2,
    thousand_separator: ',',
    decimal_separator: '.',
    symbol_position: 'before',
    supported_payment_methods: ['card', 'mobile_money', 'bank_transfer'],
    flutterwave_supported: true,
    country: 'Ghana',
    flag: '🇬🇭'
  },
  ZAR: {
    code: 'ZAR',
    name: 'South African Rand',
    symbol: 'R',
    decimal_places: 2,
    thousand_separator: ',',
    decimal_separator: '.',
    symbol_position: 'before',
    supported_payment_methods: ['card', 'bank_transfer'],
    flutterwave_supported: true,
    country: 'South Africa',
    flag: '🇿🇦'
  }
};

/**
 * Get currency configuration by code
 */
export const getCurrency = (currencyCode) => {
  return SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.USD;
};

/**
 * Get list of all supported currencies
 */
export const getAllCurrencies = () => {
  return Object.values(SUPPORTED_CURRENCIES);
};

/**
 * Get currencies supported for a specific payment method
 */
export const getCurrenciesByPaymentMethod = (paymentMethod) => {
  return Object.values(SUPPORTED_CURRENCIES).filter(currency => 
    currency.supported_payment_methods.includes(paymentMethod)
  );
};

/**
 * Format currency amount according to currency rules
 */
export const formatCurrency = (amount, currencyCode = 'USD') => {
  const currency = getCurrency(currencyCode);
  
  if (!amount && amount !== 0) {
    return `${currency.symbol}0${currency.decimal_separator}${'0'.repeat(currency.decimal_places)}`;
  }

  // Convert to number and fix decimal places
  const numAmount = parseFloat(amount).toFixed(currency.decimal_places);
  const [integerPart, decimalPart] = numAmount.split('.');
  
  // Add thousand separators
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousand_separator);
  
  // Combine integer and decimal parts
  const formattedAmount = decimalPart ? 
    `${formattedInteger}${currency.decimal_separator}${decimalPart}` : 
    formattedInteger;

  // Position symbol
  if (currency.symbol_position === 'before') {
    return `${currency.symbol}${formattedAmount}`;
  } else {
    return `${formattedAmount} ${currency.symbol}`;
  }
};

/**
 * Parse currency string to numeric value
 */
export const parseCurrency = (currencyString, currencyCode = 'USD') => {
  if (!currencyString) return 0;
  
  const currency = getCurrency(currencyCode);
  
  // Remove currency symbol and separators, keep only numbers and decimal separator
  let cleanString = currencyString.toString()
    .replace(new RegExp(`\\${currency.symbol}`, 'g'), '')
    .replace(new RegExp(`\\${currency.thousand_separator}`, 'g'), '')
    .trim();

  // Convert to standard decimal notation
  if (currency.decimal_separator !== '.') {
    cleanString = cleanString.replace(currency.decimal_separator, '.');
  }

  const parsed = parseFloat(cleanString);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Validate currency code
 */
export const isValidCurrency = (currencyCode) => {
  return Object.keys(SUPPORTED_CURRENCIES).includes(currencyCode);
};

/**
 * Get default currency (can be configured based on user location)
 */
export const getDefaultCurrency = () => {
  // For now, return USD as default
  // In future, this could be based on user's location or business settings
  return 'USD';
};

/**
 * Currency conversion rates (simplified - in production, use real-time rates)
 * Base currency: USD
 */
export const EXCHANGE_RATES = {
  USD: 1.00,
  ZMW: 24.50, // 1 USD = 24.50 ZMW (approximate)
  EUR: 0.85,  // 1 USD = 0.85 EUR
  GBP: 0.73,  // 1 USD = 0.73 GBP
  NGN: 800.00, // 1 USD = 800 NGN
  KES: 110.00, // 1 USD = 110 KES
  GHS: 12.00,  // 1 USD = 12 GHS
  ZAR: 18.50   // 1 USD = 18.50 ZAR
};

/**
 * Convert amount from one currency to another
 * Note: In production, use real-time exchange rates
 */
export const convertCurrency = (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) return amount;
  
  // Convert to USD first, then to target currency
  const usdAmount = amount / EXCHANGE_RATES[fromCurrency];
  const convertedAmount = usdAmount * EXCHANGE_RATES[toCurrency];
  
  return parseFloat(convertedAmount.toFixed(2));
};

/**
 * Get exchange rate between two currencies
 */
export const getExchangeRate = (fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) return 1;
  
  return EXCHANGE_RATES[toCurrency] / EXCHANGE_RATES[fromCurrency];
};