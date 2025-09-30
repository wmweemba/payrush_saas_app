/**
 * Currency Service
 * 
 * Handles currency conversion, exchange rates, and currency-related operations
 */

const { supabase } = require('../config/database');

class CurrencyService {
  // Supported currencies with metadata
  static SUPPORTED_CURRENCIES = {
    USD: {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      flag: '🇺🇸',
      decimals: 2,
      region: 'Global'
    },
    ZMW: {
      code: 'ZMW',
      name: 'Zambian Kwacha',
      symbol: 'K',
      flag: '🇿🇲',
      decimals: 2,
      region: 'Africa'
    },
    EUR: {
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      flag: '🇪🇺',
      decimals: 2,
      region: 'Europe'
    },
    GBP: {
      code: 'GBP',
      name: 'British Pound',
      symbol: '£',
      flag: '🇬🇧',
      decimals: 2,
      region: 'Europe'
    },
    NGN: {
      code: 'NGN',
      name: 'Nigerian Naira',
      symbol: '₦',
      flag: '🇳🇬',
      decimals: 2,
      region: 'Africa'
    },
    KES: {
      code: 'KES',
      name: 'Kenyan Shilling',
      symbol: 'KSh',
      flag: '🇰🇪',
      decimals: 2,
      region: 'Africa'
    },
    GHS: {
      code: 'GHS',
      name: 'Ghanaian Cedi',
      symbol: '₵',
      flag: '🇬🇭',
      decimals: 2,
      region: 'Africa'
    },
    ZAR: {
      code: 'ZAR',
      name: 'South African Rand',
      symbol: 'R',
      flag: '🇿🇦',
      decimals: 2,
      region: 'Africa'
    }
  };

  // Payment methods by region/currency
  static PAYMENT_METHODS = {
    card: {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: '💳',
      supported_currencies: ['USD', 'EUR', 'GBP', 'ZMW', 'NGN', 'KES', 'GHS', 'ZAR'],
      regions: ['Global']
    },
    bank_transfer: {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      icon: '🏦',
      supported_currencies: ['USD', 'EUR', 'GBP', 'ZMW', 'NGN', 'KES', 'GHS', 'ZAR'],
      regions: ['Global']
    },
    mobile_money: {
      id: 'mobile_money',
      name: 'Mobile Money',
      icon: '📱',
      supported_currencies: ['ZMW', 'NGN', 'KES', 'GHS', 'ZAR'],
      regions: ['Africa']
    },
    ussd: {
      id: 'ussd',
      name: 'USSD Banking',
      icon: '📞',
      supported_currencies: ['NGN', 'KES', 'GHS'],
      regions: ['Africa']
    },
    crypto: {
      id: 'crypto',
      name: 'Cryptocurrency',
      icon: '₿',
      supported_currencies: ['USD', 'EUR', 'GBP'],
      regions: ['Global']
    }
  };

  /**
   * Get all supported currencies
   */
  static getSupportedCurrencies() {
    return Object.values(this.SUPPORTED_CURRENCIES);
  }

  /**
   * Get currency metadata
   */
  static getCurrencyMetadata(currencyCode) {
    return this.SUPPORTED_CURRENCIES[currencyCode] || null;
  }

  /**
   * Get payment methods for a currency
   */
  static getPaymentMethodsForCurrency(currencyCode) {
    return Object.values(this.PAYMENT_METHODS).filter(method =>
      method.supported_currencies.includes(currencyCode)
    );
  }

  /**
   * Format currency amount
   */
  static formatCurrency(amount, currencyCode, locale = 'en-US') {
    const currency = this.SUPPORTED_CURRENCIES[currencyCode];
    if (!currency) {
      return `${amount}`;
    }

    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: currency.decimals,
        maximumFractionDigits: currency.decimals,
      }).format(amount);
    } catch (error) {
      // Fallback formatting
      return `${currency.symbol}${Number(amount).toFixed(currency.decimals)}`;
    }
  }

  /**
   * Get latest exchange rate between two currencies
   */
  static async getExchangeRate(fromCurrency, toCurrency) {
    try {
      const { data, error } = await supabase
        .rpc('get_exchange_rate', {
          from_curr: fromCurrency,
          to_curr: toCurrency
        });

      if (error) {
        console.error('Error fetching exchange rate:', error);
        return 1.0; // Fallback to 1:1 rate
      }

      return data || 1.0;
    } catch (error) {
      console.error('Error in getExchangeRate:', error);
      return 1.0;
    }
  }

  /**
   * Convert amount between currencies
   */
  static async convertCurrency(amount, fromCurrency, toCurrency) {
    try {
      const { data, error } = await supabase
        .rpc('convert_currency', {
          amount: amount,
          from_curr: fromCurrency,
          to_curr: toCurrency
        });

      if (error) {
        console.error('Error converting currency:', error);
        return amount; // Return original amount on error
      }

      return data || amount;
    } catch (error) {
      console.error('Error in convertCurrency:', error);
      return amount;
    }
  }

  /**
   * Get all exchange rates for a base currency
   */
  static async getExchangeRates(baseCurrency = 'USD') {
    try {
      const { data, error } = await supabase
        .from('currency_rates')
        .select('from_currency, to_currency, rate, effective_date')
        .eq('from_currency', baseCurrency)
        .order('effective_date', { ascending: false });

      if (error) {
        console.error('Error fetching exchange rates:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getExchangeRates:', error);
      return [];
    }
  }

  /**
   * Update exchange rates (admin function)
   */
  static async updateExchangeRates(rates) {
    try {
      const rateData = rates.map(rate => ({
        from_currency: rate.from,
        to_currency: rate.to,
        rate: rate.rate,
        effective_date: rate.date || new Date().toISOString().split('T')[0]
      }));

      const { data, error } = await supabase
        .from('currency_rates')
        .upsert(rateData, {
          onConflict: 'from_currency,to_currency,effective_date'
        });

      if (error) {
        console.error('Error updating exchange rates:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in updateExchangeRates:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get client's preferred currency and payment methods
   */
  static async getClientCurrencyPreferences(clientId, userId) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('preferred_currency, payment_methods, auto_currency_conversion')
        .eq('id', clientId)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching client currency preferences:', error);
        return {
          success: false,
          error: error.message,
          statusCode: 404
        };
      }

      return {
        success: true,
        data: {
          preferred_currency: data.preferred_currency || 'USD',
          payment_methods: data.payment_methods || ['card', 'bank_transfer'],
          auto_currency_conversion: data.auto_currency_conversion || false,
          currency_metadata: this.getCurrencyMetadata(data.preferred_currency || 'USD'),
          available_payment_methods: this.getPaymentMethodsForCurrency(data.preferred_currency || 'USD')
        }
      };
    } catch (error) {
      console.error('Error in getClientCurrencyPreferences:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Update client currency preferences
   */
  static async updateClientCurrencyPreferences(clientId, userId, preferences) {
    try {
      const updateData = {};

      if (preferences.preferred_currency) {
        // Validate currency code
        if (!this.SUPPORTED_CURRENCIES[preferences.preferred_currency]) {
          return {
            success: false,
            error: 'Invalid currency code',
            statusCode: 400
          };
        }
        updateData.preferred_currency = preferences.preferred_currency;
      }

      if (preferences.payment_methods) {
        // Validate payment methods
        const validMethods = Object.keys(this.PAYMENT_METHODS);
        const invalidMethods = preferences.payment_methods.filter(method => 
          !validMethods.includes(method)
        );
        
        if (invalidMethods.length > 0) {
          return {
            success: false,
            error: `Invalid payment methods: ${invalidMethods.join(', ')}`,
            statusCode: 400
          };
        }
        updateData.payment_methods = preferences.payment_methods;
      }

      if (typeof preferences.auto_currency_conversion === 'boolean') {
        updateData.auto_currency_conversion = preferences.auto_currency_conversion;
      }

      const { data, error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', clientId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating client currency preferences:', error);
        return {
          success: false,
          error: error.message,
          statusCode: 400
        };
      }

      return {
        success: true,
        data: {
          preferred_currency: data.preferred_currency,
          payment_methods: data.payment_methods,
          auto_currency_conversion: data.auto_currency_conversion,
          currency_updated_at: data.currency_updated_at
        }
      };
    } catch (error) {
      console.error('Error in updateClientCurrencyPreferences:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }
}

module.exports = CurrencyService;