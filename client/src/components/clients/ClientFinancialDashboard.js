/**
 * Client Financial Dashboard Component
 * 
 * Comprehensive financial overview for a specific client including:
 * - Financial summary with key metrics
 * - Payment history timeline
 * - Invoice aging analysis
 * - Recent activity feed
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, DollarSign, Clock, Activity, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const ClientFinancialDashboard = ({ clientId, clientName }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  
  // Data states
  const [financialSummary, setFinancialSummary] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [invoiceAging, setInvoiceAging] = useState(null);
  const [activity, setActivity] = useState([]);
  
  // Filter states
  const [dateRange, setDateRange] = useState('3months');
  const [invoiceFilter, setInvoiceFilter] = useState('all');

  useEffect(() => {
    if (clientId) {
      loadFinancialData();
    }
  }, [clientId, dateRange]);

  const loadFinancialData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Calculate date range
      const dateTo = new Date().toISOString().split('T')[0];
      const dateFrom = getDateFromRange(dateRange);

      // Load all financial data in parallel
      const [summaryRes, historyRes, invoicesRes, agingRes, activityRes] = await Promise.all([
        fetch(`${API_BASE_URL}/clients/${clientId}/financial-summary`, { headers }),
        fetch(`${API_BASE_URL}/clients/${clientId}/payment-history?dateFrom=${dateFrom}&dateTo=${dateTo}`, { headers }),
        fetch(`${API_BASE_URL}/clients/${clientId}/invoices?dateFrom=${dateFrom}&dateTo=${dateTo}`, { headers }),
        fetch(`${API_BASE_URL}/clients/${clientId}/invoice-aging`, { headers }),
        fetch(`${API_BASE_URL}/clients/${clientId}/activity?limit=10`, { headers })
      ]);

      // Parse responses
      const summaryData = await summaryRes.json();
      const historyData = await historyRes.json();
      const invoicesData = await invoicesRes.json();
      const agingData = await agingRes.json();
      const activityData = await activityRes.json();

      // Update state with proper fallbacks
      if (summaryData.success) setFinancialSummary(summaryData.data);
      if (historyData.success) setPaymentHistory(Array.isArray(historyData.data) ? historyData.data : []);
      if (invoicesData.success) setInvoices(Array.isArray(invoicesData.data) ? invoicesData.data : []);
      if (agingData.success) setInvoiceAging(agingData.data);
      if (activityData.success) setActivity(Array.isArray(activityData.data) ? activityData.data : []);

    } catch (err) {
      console.error('Error loading financial data:', err);
      setError('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const getDateFromRange = (range) => {
    const date = new Date();
    switch (range) {
      case '1month':
        date.setMonth(date.getMonth() - 1);
        break;
      case '3months':
        date.setMonth(date.getMonth() - 3);
        break;
      case '6months':
        date.setMonth(date.getMonth() - 6);
        break;
      case '1year':
        date.setFullYear(date.getFullYear() - 1);
        break;
      default:
        date.setMonth(date.getMonth() - 3);
    }
    return date.toISOString().split('T')[0];
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      case 'draft':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (invoiceFilter === 'all') return true;
    return invoice.status?.toLowerCase() === invoiceFilter;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Financial Dashboard</h2>
          <p className="text-gray-600">{clientName}</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px] bg-white border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
              <SelectItem value="1month" className="bg-white hover:bg-gray-100 text-gray-900 cursor-pointer">Last Month</SelectItem>
              <SelectItem value="3months" className="bg-white hover:bg-gray-100 text-gray-900 cursor-pointer">Last 3 Months</SelectItem>
              <SelectItem value="6months" className="bg-white hover:bg-gray-100 text-gray-900 cursor-pointer">Last 6 Months</SelectItem>
              <SelectItem value="1year" className="bg-white hover:bg-gray-100 text-gray-900 cursor-pointer">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Financial Summary Cards */}
      {financialSummary ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(financialSummary.totalRevenue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Outstanding Amount</p>
                  <p className="text-2xl font-bold">{formatCurrency(financialSummary.outstandingAmount)}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overdue Amount</p>
                  <p className="text-2xl font-bold">{formatCurrency(financialSummary.overdueAmount)}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Days to Pay</p>
                  <p className="text-2xl font-bold">{Math.round(financialSummary.averageDaysToPay || 0)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">No Data Available</p>
                    <p className="text-2xl font-bold">$0.00</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-gray-300" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          {invoiceAging ? (
            <Card>
              <CardHeader>
                <CardTitle>Invoice Aging Analysis</CardTitle>
                <CardDescription>
                  Track outstanding invoices by aging periods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Current (0-30 days)</p>
                      <p className="text-lg font-semibold">{formatCurrency(invoiceAging.current)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">31-60 days</p>
                      <p className="text-lg font-semibold">{formatCurrency(invoiceAging.days31_60)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">61-90 days</p>
                      <p className="text-lg font-semibold">{formatCurrency(invoiceAging.days61_90)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">90+ days</p>
                      <p className="text-lg font-semibold text-red-600">{formatCurrency(invoiceAging.over90Days)}</p>
                    </div>
                  </div>
                  
                  {invoiceAging.total > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Collection Progress</span>
                        <span>{Math.round((invoiceAging.current / invoiceAging.total) * 100)}% current</span>
                      </div>
                      <Progress value={(invoiceAging.current / invoiceAging.total) * 100} className="h-2" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Invoice Aging Analysis</CardTitle>
                <CardDescription>
                  Track outstanding invoices by aging periods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-500">No invoice aging data available</p>
                  <p className="text-sm text-gray-400">Invoice aging analysis will appear here once invoices are created</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Invoices</h3>
            <Select value={invoiceFilter} onValueChange={setInvoiceFilter}>
              <SelectTrigger className="w-[150px] bg-white border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                <SelectItem value="all" className="bg-white hover:bg-gray-100 text-gray-900 cursor-pointer">All Status</SelectItem>
                <SelectItem value="draft" className="bg-white hover:bg-gray-100 text-gray-900 cursor-pointer">Draft</SelectItem>
                <SelectItem value="pending" className="bg-white hover:bg-gray-100 text-gray-900 cursor-pointer">Pending</SelectItem>
                <SelectItem value="paid" className="bg-white hover:bg-gray-100 text-gray-900 cursor-pointer">Paid</SelectItem>
                <SelectItem value="overdue" className="bg-white hover:bg-gray-100 text-gray-900 cursor-pointer">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{formatDate(invoice.created_at)}</TableCell>
                      <TableCell>{formatDate(invoice.due_date)}</TableCell>
                      <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredInvoices.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No invoices found for the selected criteria.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                Complete payment history for this client
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.payment_date)}</TableCell>
                      <TableCell>{payment.invoice_number}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell className="capitalize">{payment.payment_method}</TableCell>
                      <TableCell>{payment.reference || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {paymentHistory.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No payment history found for the selected period.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest financial activities and events for this client
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(activity) && activity.length > 0 ? (
                  activity.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 pb-4 border-b last:border-b-0">
                      <div className="mt-1">
                        <Activity className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.description}</p>
                        <p className="text-xs text-gray-500">{formatDate(item.created_at)}</p>
                      </div>
                      {item.amount && (
                        <div className="text-sm font-medium">
                          {formatCurrency(item.amount)}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Financial Activity Yet</h3>
                    <p className="text-gray-600 mb-4">
                      No financial activities or transactions have been recorded for this client yet.
                    </p>
                    <p className="text-sm text-gray-500">
                      Activity will appear here when invoices are created, payments are received, or other financial events occur.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientFinancialDashboard;