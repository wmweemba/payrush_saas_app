/**
 * Invoice Search and Filter Interface
 * Provides advanced search, filtering, and sorting capabilities for invoice management
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CurrencySelect } from '@/components/ui/CurrencySelect';
import { formatCurrency } from '@/lib/currency/currencies';

const InvoiceSearchInterface = ({ 
  onSearch, 
  onClearFilters, 
  loading = false, 
  totalResults = 0,
  currentFilters = {} 
}) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState(currentFilters.query || '');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    statuses: currentFilters.statuses || [],
    dateFrom: currentFilters.dateFrom || '',
    dateTo: currentFilters.dateTo || '',
    currency: currentFilters.currency || '',
    amountMin: currentFilters.amountMin || '',
    amountMax: currentFilters.amountMax || '',
    sortBy: currentFilters.sortBy || 'created_at',
    sortOrder: currentFilters.sortOrder || 'desc'
  });

  // Available options for filters
  const [filterOptions, setFilterOptions] = useState({
    statuses: ['Draft', 'Pending', 'Sent', 'Paid', 'Overdue', 'Cancelled'],
    currencies: ['USD', 'EUR', 'GBP', 'NGN', 'KES', 'UGX', 'TZS'],
    customers: []
  });

  // Quick filter presets
  const quickFilters = [
    { label: 'All Invoices', value: 'all', icon: '📄' },
    { label: 'Overdue', value: 'overdue', icon: '⚠️' },
    { label: 'Draft', value: 'draft', icon: '📝' },
    { label: 'Paid', value: 'paid', icon: '✅' },
    { label: 'Pending', value: 'pending', icon: '⏳' },
    { label: 'This Month', value: 'this-month', icon: '📅' },
    { label: 'Last 30 Days', value: 'last-30-days', icon: '🗓️' },
    { label: 'High Value', value: 'high-value', icon: '💰' }
  ];

  // Sort options
  const sortOptions = [
    { label: 'Created Date', value: 'created_at' },
    { label: 'Due Date', value: 'due_date' },
    { label: 'Amount', value: 'amount' },
    { label: 'Customer Name', value: 'customer_name' },
    { label: 'Status', value: 'status' }
  ];

  // Load filter options on mount
  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/invoices/search/filters', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFilterOptions(prev => ({
          ...prev,
          ...data.data
        }));
      }
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  // Handle search submission
  const handleSearch = useCallback(() => {
    const searchParams = {
      query: searchQuery.trim(),
      ...filters,
      // Remove empty values
      statuses: filters.statuses.length > 0 ? filters.statuses : undefined,
      currency: filters.currency || undefined,
      amountMin: filters.amountMin ? parseFloat(filters.amountMin) : undefined,
      amountMax: filters.amountMax ? parseFloat(filters.amountMax) : undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined
    };

    // Remove undefined values
    Object.keys(searchParams).forEach(key => {
      if (searchParams[key] === undefined || searchParams[key] === '') {
        delete searchParams[key];
      }
    });

    onSearch(searchParams);
  }, [searchQuery, filters, onSearch]);

  // Handle quick filter selection
  const handleQuickFilter = async (preset) => {
    if (preset === 'all') {
      handleClearFilters();
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/invoices/search/quick/${preset}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // This will trigger the parent component to show results
        onSearch({ preset });
      }
    } catch (error) {
      console.error('Quick filter failed:', error);
    }
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setFilters({
      statuses: [],
      dateFrom: '',
      dateTo: '',
      currency: '',
      amountMin: '',
      amountMax: '',
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
    onClearFilters();
  };

  // Handle status toggle
  const toggleStatus = (status) => {
    setFilters(prev => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter(s => s !== status)
        : [...prev.statuses, status]
    }));
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (filters.statuses.length > 0) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.currency) count++;
    if (filters.amountMin || filters.amountMax) count++;
    return count;
  };

  // Handle Enter key in search input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Search & Filter Invoices</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {totalResults > 0 ? `${totalResults} invoice${totalResults !== 1 ? 's' : ''} found` : 'Enter search criteria'}
          </p>
        </div>
        {getActiveFilterCount() > 0 && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
            {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} active
          </Badge>
        )}
      </div>

      {/* Quick Filters */}
      <div>
        <Label className="text-sm font-medium mb-3 block text-gray-700 dark:text-gray-300">Quick Filters</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {quickFilters.map((filter) => (
            <Button
              key={filter.value}
              variant="outline"
              size="sm"
              onClick={() => handleQuickFilter(filter.value)}
              className="justify-start text-xs h-8 px-2 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
            >
              <span className="mr-1">{filter.icon}</span>
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Search */}
      <div className="flex space-x-2">
        <div className="flex-1">
          <Input
            placeholder="Search customers, invoice numbers, or descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
          />
        </div>
        <Button 
          onClick={handleSearch} 
          disabled={loading}
          className="payrush-gradient text-white"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            '🔍 Search'
          )}
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600"
        >
          {showAdvanced ? '🔽 Less' : '⚙️ More'}
        </Button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t pt-6 bg-gray-50 dark:bg-slate-800/50 -mx-6 px-6 pb-6 rounded-b-xl">
          <Tabs defaultValue="filters" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600">
              <TabsTrigger value="filters" className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300">Filters</TabsTrigger>
              <TabsTrigger value="sorting" className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300">Sorting</TabsTrigger>
            </TabsList>

            <TabsContent value="filters" className="space-y-4 mt-4">
              {/* Status Filter */}
              <div>
                <Label className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300">Status</Label>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.statuses.map((status) => (
                    <Button
                      key={status}
                      variant={filters.statuses.includes(status) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleStatus(status)}
                      className={`h-8 px-3 text-xs ${
                        filters.statuses.includes(status) 
                          ? 'payrush-gradient text-white' 
                          : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600'
                      }`}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateFrom" className="text-sm font-medium mb-1 block text-gray-700 dark:text-gray-300">
                    From Date
                  </Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    className="bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo" className="text-sm font-medium mb-1 block text-gray-700 dark:text-gray-300">
                    To Date
                  </Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    className="bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Currency and Amount */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-1 block text-gray-700 dark:text-gray-300">Currency</Label>
                  <Select
                    value={filters.currency || "all"}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, currency: value === "all" ? "" : value }))}
                  >
                    <SelectTrigger className="bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                      <SelectValue placeholder="Any currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any currency</SelectItem>
                      {filterOptions.currencies.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amountMin" className="text-sm font-medium mb-1 block text-gray-700 dark:text-gray-300">
                    Min Amount
                  </Label>
                  <Input
                    id="amountMin"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={filters.amountMin}
                    onChange={(e) => setFilters(prev => ({ ...prev, amountMin: e.target.value }))}
                    className="bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <Label htmlFor="amountMax" className="text-sm font-medium mb-1 block text-gray-700 dark:text-gray-300">
                    Max Amount
                  </Label>
                  <Input
                    id="amountMax"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={filters.amountMax}
                    onChange={(e) => setFilters(prev => ({ ...prev, amountMax: e.target.value }))}
                    className="bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sorting" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-1 block text-gray-700 dark:text-gray-300">Sort By</Label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
                  >
                    <SelectTrigger className="bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1 block text-gray-700 dark:text-gray-300">Sort Order</Label>
                  <Select
                    value={filters.sortOrder}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, sortOrder: value }))}
                  >
                    <SelectTrigger className="bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Newest First</SelectItem>
                      <SelectItem value="asc">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
        <Button
          variant="outline"
          onClick={handleClearFilters}
          disabled={getActiveFilterCount() === 0 && !searchQuery.trim()}
          className="bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600"
        >
          🗑️ Clear All
        </Button>
        <Button 
          onClick={handleSearch} 
          disabled={loading} 
          className="payrush-gradient text-white"
        >
          {loading ? 'Searching...' : '🔍 Apply Filters'}
        </Button>
      </div>
    </div>
  );
};

export default InvoiceSearchInterface;