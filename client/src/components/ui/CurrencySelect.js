/**
 * Currency Selection Component for PayRush
 * Provides dropdown selection for supported currencies
 */

"use client"

import React from 'react';
import { getAllCurrencies, getCurrency, formatCurrency } from '@/lib/currency/currencies';

// Re-export currency utilities for convenience
export { formatCurrency, getCurrency, getAllCurrencies } from '@/lib/currency/currencies';

export const CurrencySelect = ({ 
  value = 'USD', 
  onChange, 
  disabled = false,
  className = "",
  showFlag = true,
  showFullName = false 
}) => {
  const currencies = getAllCurrencies();
  const selectedCurrency = getCurrency(value);

  const handleChange = (event) => {
    if (onChange) {
      onChange(event.target.value);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
      >
        {currencies.map((currency) => (
          <option key={currency.code} value={currency.code} className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
            {showFlag && `${currency.flag} `}
            {currency.code} - {currency.symbol}
            {showFullName && ` (${currency.name})`}
          </option>
        ))}
      </select>
      
      {/* Selected currency info */}
      <div className="absolute right-10 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
        {showFlag && selectedCurrency.flag}
      </div>
    </div>
  );
};

/**
 * Currency Display Component
 * Shows currency with proper formatting
 */
export const CurrencyDisplay = ({ 
  amount, 
  currency = 'USD', 
  className = "",
  showCode = true 
}) => {
  const currencyConfig = getCurrency(currency);
  
  return (
    <span className={`${className}`}>
      {currencyConfig.flag} {formatCurrency(amount, currency)}
      {showCode && ` ${currency}`}
    </span>
  );
};

/**
 * Currency Input Component
 * Input field with currency formatting
 */
export const CurrencyInput = ({
  value,
  currency = 'USD',
  onChange,
  placeholder = "0.00",
  disabled = false,
  className = ""
}) => {
  const currencyConfig = getCurrency(currency);
  
  const handleChange = (event) => {
    let inputValue = event.target.value;
    
    // Remove currency symbol if present
    inputValue = inputValue.replace(currencyConfig.symbol, '').trim();
    
    // Allow only numbers and decimal separator
    const regex = new RegExp(`[^0-9\\${currencyConfig.decimal_separator}]`, 'g');
    inputValue = inputValue.replace(regex, '');
    
    // Ensure only one decimal separator
    const parts = inputValue.split(currencyConfig.decimal_separator);
    if (parts.length > 2) {
      inputValue = parts[0] + currencyConfig.decimal_separator + parts.slice(1).join('');
    }
    
    // Limit decimal places
    if (parts[1] && parts[1].length > currencyConfig.decimal_places) {
      inputValue = parts[0] + currencyConfig.decimal_separator + parts[1].substring(0, currencyConfig.decimal_places);
    }
    
    if (onChange) {
      onChange(inputValue);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
        {currencyConfig.flag} {currencyConfig.symbol}
      </div>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
    </div>
  );
};

export default CurrencySelect;