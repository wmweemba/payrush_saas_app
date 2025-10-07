/**
 * Client Currency Preferences Component
 * 
 * Manages client-specific currency settings and payment method preferences
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DollarSign, 
  CreditCard, 
  Smartphone, 
  Building2, 
  Bitcoin, 
  Phone,
  CheckCircle,
  AlertTriangle,
  Save,
  RefreshCw
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const ClientCurrencyPreferences = ({ clientId, clientName }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Data states
  const [preferences, setPreferences] = useState(null);
  const [availableCurrencies, setAvailableCurrencies] = useState([]);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState([]);
  const [exchangeRates, setExchangeRates] = useState([]);
  
  // Form states
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState([]);
  const [autoCurrencyConversion, setAutoCurrencyConversion] = useState(false);

  useEffect(() => {
    if (clientId) {
      loadCurrencyData();
    }
  }, [clientId]);

  const loadCurrencyData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Load all currency data in parallel
      const [preferencesRes, currenciesRes, ratesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/clients/${clientId}/currency-preferences`, { headers }),
        fetch(`${API_BASE_URL}/clients/currencies`, { headers }),
        fetch(`${API_BASE_URL}/clients/exchange-rates?base_currency=USD`, { headers })
      ]);

      // Parse responses
      const preferencesData = await preferencesRes.json();
      const currenciesData = await currenciesRes.json();
      const ratesData = await ratesRes.json();

      console.log('Currencies response:', currenciesData);
      console.log('Available currencies:', currenciesData.data?.currencies);

      // Update state
      if (preferencesData.success) {
        const prefs = preferencesData.data;
        setPreferences(prefs);
        setSelectedCurrency(prefs.preferred_currency);
        setSelectedPaymentMethods(prefs.payment_methods || []);
        setAutoCurrencyConversion(prefs.auto_currency_conversion || false);
      }

      if (currenciesData.success) {
        setAvailableCurrencies(currenciesData.data.currencies);
        setAvailablePaymentMethods(currenciesData.data.payment_methods);
      } else {
        // Fallback to default currencies if API fails
        console.warn('Failed to fetch currencies, using fallback:', currenciesData);
        setAvailableCurrencies([
          { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', decimals: 2, region: 'Global' },
          { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', decimals: 2, region: 'Europe' },
          { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', decimals: 2, region: 'Europe' },
          { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'K', flag: '🇿🇲', decimals: 2, region: 'Africa' }
        ]);
        setAvailablePaymentMethods([
          { id: 'card', name: 'Credit/Debit Card', supported_currencies: ['USD', 'EUR', 'GBP', 'ZMW'], regions: ['Global'] },
          { id: 'bank_transfer', name: 'Bank Transfer', supported_currencies: ['USD', 'EUR', 'GBP', 'ZMW'], regions: ['Global'] }
        ]);
      }

      if (ratesData.success) {
        setExchangeRates(ratesData.data.rates);
      }

    } catch (err) {
      console.error('Error loading currency data:', err);
      setError('Failed to load currency preferences');
      
      // Set fallback currencies even on network error
      setAvailableCurrencies([
        { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', decimals: 2, region: 'Global' },
        { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', decimals: 2, region: 'Europe' },
        { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', decimals: 2, region: 'Europe' },
        { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'K', flag: '🇿🇲', decimals: 2, region: 'Africa' }
      ]);
      setAvailablePaymentMethods([
        { id: 'card', name: 'Credit/Debit Card', supported_currencies: ['USD', 'EUR', 'GBP', 'ZMW'], regions: ['Global'] },
        { id: 'bank_transfer', name: 'Bank Transfer', supported_currencies: ['USD', 'EUR', 'GBP', 'ZMW'], regions: ['Global'] }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${API_BASE_URL}/clients/${clientId}/currency-preferences`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          preferred_currency: selectedCurrency,
          payment_methods: selectedPaymentMethods,
          auto_currency_conversion: autoCurrencyConversion
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setPreferences(prev => ({
          ...prev,
          preferred_currency: selectedCurrency,
          payment_methods: selectedPaymentMethods,
          auto_currency_conversion: autoCurrencyConversion
        }));
        
        // Hide success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.message || 'Failed to save preferences');
      }

    } catch (err) {
      console.error('Error saving currency preferences:', err);
      setError('Failed to save currency preferences');
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentMethodToggle = (methodId) => {
    setSelectedPaymentMethods(prev => {
      if (prev.includes(methodId)) {
        return prev.filter(id => id !== methodId);
      } else {
        return [...prev, methodId];
      }
    });
  };

  const getPaymentMethodIcon = (methodId) => {
    const icons = {
      card: <CreditCard className="h-4 w-4" />,
      bank_transfer: <Building2 className="h-4 w-4" />,
      mobile_money: <Smartphone className="h-4 w-4" />,
      ussd: <Phone className="h-4 w-4" />,
      crypto: <Bitcoin className="h-4 w-4" />
    };
    return icons[methodId] || <DollarSign className="h-4 w-4" />;
  };

  const formatCurrency = (amount, currencyCode) => {
    const currency = availableCurrencies.find(c => c.code === currencyCode);
    if (!currency) return amount;

    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: currency.decimals || 2,
        maximumFractionDigits: currency.decimals || 2,
      }).format(amount);
    } catch (error) {
      return `${currency.symbol}${Number(amount).toFixed(currency.decimals || 2)}`;
    }
  };

  const getAvailablePaymentMethodsForCurrency = () => {
    return availablePaymentMethods.filter(method =>
      method.supported_currencies.includes(selectedCurrency)
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (error && !preferences) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const selectedCurrencyData = availableCurrencies.find(c => c.code === selectedCurrency);
  const hasChanges = preferences && (
    preferences.preferred_currency !== selectedCurrency ||
    JSON.stringify(preferences.payment_methods) !== JSON.stringify(selectedPaymentMethods) ||
    preferences.auto_currency_conversion !== autoCurrencyConversion
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Currency & Payment Preferences</h2>
          <p className="text-gray-600">{clientName}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadCurrencyData} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={handleSavePreferences} 
            disabled={saving || !hasChanges}
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>Currency preferences saved successfully!</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Currency Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Preferred Currency
            </CardTitle>
            <CardDescription>
              Set the default currency for invoices and payments for this client
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Currency</label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger className="bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-600 shadow-lg z-50">
                  {availableCurrencies.map((currency) => (
                    <SelectItem 
                      key={currency.code} 
                      value={currency.code}
                      className="bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span>{currency.flag}</span>
                        <span className="font-medium">{currency.code}</span>
                        <span className="text-gray-600">- {currency.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCurrencyData && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Symbol:</span>
                    <span className="ml-2">{selectedCurrencyData.symbol}</span>
                  </div>
                  <div>
                    <span className="font-medium">Region:</span>
                    <span className="ml-2">{selectedCurrencyData.region}</span>
                  </div>
                  <div>
                    <span className="font-medium">Decimals:</span>
                    <span className="ml-2">{selectedCurrencyData.decimals}</span>
                  </div>
                  <div>
                    <span className="font-medium">Example:</span>
                    <span className="ml-2">{formatCurrency(1000, selectedCurrency)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="auto-conversion"
                checked={autoCurrencyConversion}
                onChange={(e) => setAutoCurrencyConversion(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="auto-conversion" className="text-sm text-gray-700">
                Automatically convert invoice amounts to this currency
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Methods
            </CardTitle>
            <CardDescription>
              Select preferred payment methods for this client
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getAvailablePaymentMethodsForCurrency().map((method) => (
                <div
                  key={method.id}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedPaymentMethods.includes(method.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handlePaymentMethodToggle(method.id)}
                >
                  <div className="flex items-center gap-3">
                    {getPaymentMethodIcon(method.id)}
                    <div>
                      <div className="font-medium">{method.name}</div>
                      <div className="text-sm text-gray-500">
                        Available in {method.regions.join(', ')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedPaymentMethods.includes(method.id) && (
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {selectedPaymentMethods.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No payment methods selected
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Exchange Rates (if available) */}
      {exchangeRates.length > 0 && selectedCurrency !== 'USD' && (
        <Card>
          <CardHeader>
            <CardTitle>Current Exchange Rates</CardTitle>
            <CardDescription>
              Current exchange rates from USD to {selectedCurrency}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {exchangeRates
                .filter(rate => rate.to_currency === selectedCurrency)
                .slice(0, 4)
                .map((rate) => (
                  <div key={`${rate.from_currency}-${rate.to_currency}`} className="text-center">
                    <div className="text-sm text-gray-600">
                      {rate.from_currency} → {rate.to_currency}
                    </div>
                    <div className="text-lg font-semibold">
                      {Number(rate.rate).toFixed(6)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(rate.effective_date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Settings Summary */}
      {preferences && (
        <Card>
          <CardHeader>
            <CardTitle>Current Settings</CardTitle>
            <CardDescription>
              Summary of current currency and payment preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Preferred Currency</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">
                    {preferences.currency_metadata?.flag} {preferences.preferred_currency}
                  </Badge>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Payment Methods</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(preferences.payment_methods || []).map((method) => (
                    <Badge key={method} variant="secondary" className="text-xs">
                      {method.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Auto Conversion</div>
                <div className="mt-1">
                  <Badge variant={preferences.auto_currency_conversion ? "default" : "outline"}>
                    {preferences.auto_currency_conversion ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientCurrencyPreferences;