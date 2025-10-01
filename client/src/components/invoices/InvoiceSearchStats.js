/**
 * Invoice Search Statistics Component
 * Displays analytics and statistics for filtered invoice results
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/currency/currencies';

const InvoiceSearchStats = ({ searchParams = {}, refreshTrigger = 0 }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load statistics
  useEffect(() => {
    loadStats();
  }, [searchParams, refreshTrigger]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            queryParams.append(key, value.join(','));
          } else {
            queryParams.append(key, value);
          }
        }
      });

      const response = await fetch(`/api/invoices/search/stats?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Calculate totals and percentages
  const totalInvoices = stats.total;
  const overdueCount = stats.overdue || 0;
  const overduePercentage = totalInvoices > 0 ? (overdueCount / totalInvoices) * 100 : 0;

  // Get status statistics
  const statusStats = Object.entries(stats.byStatus || {}).map(([status, count]) => ({
    status,
    count,
    percentage: totalInvoices > 0 ? (count / totalInvoices) * 100 : 0
  })).sort((a, b) => b.count - a.count);

  // Get currency statistics
  const currencyStats = Object.entries(stats.totalAmount || {}).map(([currency, total]) => ({
    currency,
    total,
    count: stats.byCurrency[currency] || 0,
    average: stats.avgAmount[currency] || 0
  })).sort((a, b) => b.total - a.total);

  // Status colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'bg-green-500';
      case 'Sent': return 'bg-blue-500';
      case 'Pending': return 'bg-yellow-500';
      case 'Draft': return 'bg-gray-500';
      case 'Overdue': return 'bg-red-500';
      case 'Cancelled': return 'bg-gray-400';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Invoices */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Invoices
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalInvoices}
                </p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Value */}
        {currencyStats.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Value
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(currencyStats[0].total, currencyStats[0].currency)}
                  </p>
                  {currencyStats.length > 1 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      + {currencyStats.length - 1} more currencies
                    </p>
                  )}
                </div>
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overdue Count */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Overdue
                </p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {overdueCount}
                </p>
                {totalInvoices > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {overduePercentage.toFixed(1)}% of total
                  </p>
                )}
              </div>
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paid Percentage */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Paid Rate
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {totalInvoices > 0 
                    ? ((stats.byStatus?.Paid || 0) / totalInvoices * 100).toFixed(1)
                    : 0
                  }%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stats.byStatus?.Paid || 0} of {totalInvoices} paid
                </p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusStats.map(({ status, count, percentage }) => (
              <div key={status} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}></div>
                    <span className="font-medium text-gray-900 dark:text-white">{status}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 dark:text-gray-400">{count}</span>
                    <Badge variant="secondary" className="text-xs">
                      {percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Currency Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Currency Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currencyStats.map(({ currency, total, count, average }) => (
              <div key={currency} className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-3 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">{currency}</span>
                  <Badge variant="outline">{count} invoice{count !== 1 ? 's' : ''}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Total Value</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(total, currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Average</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(average, currency)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {currencyStats.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                No invoices in filtered results
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoiceSearchStats;