'use client';

import { useState, useEffect } from 'react';
import { clientFormatters } from '@/lib/clientService';
import { User, MapPin, CreditCard, FileText, Edit2, TrendingUp, DollarSign, MessageCircle } from 'lucide-react';
import ClientContactsManager from './ClientContactsManager';
import ClientAddressManager from './ClientAddressManager';
import ClientFinancialDashboard from './ClientFinancialDashboard';
import ClientCurrencyPreferences from './ClientCurrencyPreferences';
import ClientCommunication from './ClientCommunication';

export default function ClientProfile({ client, onEdit, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  useEffect(() => {
    if (client) {
      loadClientInvoices();
    }
  }, [client]);

  const loadClientInvoices = async () => {
    // This would fetch invoices for the client
    // For now, we'll use mock data
    setLoadingInvoices(true);
    // Simulate API call
    setTimeout(() => {
      setInvoices([
        {
          id: '1',
          invoice_number: 'INV-001',
          amount: 1500.00,
          status: 'paid',
          due_date: '2024-01-15',
          created_at: '2023-12-15'
        },
        {
          id: '2',
          invoice_number: 'INV-002',
          amount: 2250.00,
          status: 'pending',
          due_date: '2024-02-15',
          created_at: '2024-01-15'
        }
      ]);
      setLoadingInvoices(false);
    }, 1000);
  };

  if (!client) return null;

  const status = clientFormatters.getClientStatus(client);

  const tabs = [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: User,
      count: null
    },
    { 
      id: 'contacts', 
      label: 'Contacts', 
      icon: User,
      count: null // Will be populated by the component
    },
    { 
      id: 'addresses', 
      label: 'Addresses', 
      icon: MapPin,
      count: null // Will be populated by the component
    },
    { 
      id: 'financial', 
      label: 'Financial', 
      icon: TrendingUp,
      count: null
    },
    { 
      id: 'currency', 
      label: 'Currency', 
      icon: DollarSign,
      count: null
    },
    { 
      id: 'communication', 
      label: 'Communication', 
      icon: MessageCircle,
      count: null
    },
    { 
      id: 'invoices', 
      label: 'Invoices', 
      icon: FileText,
      count: invoices.length
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Client Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Company Name</label>
                      <p className="text-sm text-gray-900">{client.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Email</label>
                      <p className="text-sm text-gray-900">{client.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-sm text-gray-900">{client.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Company</label>
                      <p className="text-sm text-gray-900">{client.company || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Client Type</label>
                      <p className="text-sm text-gray-900 capitalize">{client.client_type || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Address</label>
                      <p className="text-sm text-gray-900">
                        {[
                          client.address_line1,
                          client.address_line2,
                          client.city,
                          client.state,
                          client.postal_code,
                          client.country
                        ].filter(Boolean).join(', ') || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Default Currency</label>
                      <p className="text-sm text-gray-900">{client.default_currency || 'USD'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Payment Terms</label>
                      <p className="text-sm text-gray-900">{client.payment_terms_days || 30} days</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Credit Limit</label>
                      <p className="text-sm text-gray-900">
                        {clientFormatters.formatCurrency(client.credit_limit || 0, client.default_currency)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Current Balance</label>
                      <p className="text-sm text-gray-900">
                        {clientFormatters.formatCurrency(client.current_balance || 0, client.default_currency)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Total Invoiced</label>
                      <p className="text-sm text-gray-900">
                        {clientFormatters.formatCurrency(client.total_invoiced || 0, client.default_currency)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Total Paid</label>
                      <p className="text-sm text-gray-900">
                        {clientFormatters.formatCurrency(client.total_paid || 0, client.default_currency)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Communication Preferences */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Communication Preferences</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={client.email_notifications}
                        disabled
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Email Notifications</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={client.sms_notifications}
                        disabled
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">SMS Notifications</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={client.whatsapp_notifications}
                        disabled
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">WhatsApp Notifications</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {client.notes && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">{client.notes}</p>
                </div>
              </div>
            )}

            {/* Tags */}
            {client.tags && client.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {client.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'contacts':
        return (
          <ClientContactsManager 
            clientId={client.id} 
            clientName={client.name}
          />
        );

      case 'addresses':
        return (
          <ClientAddressManager 
            clientId={client.id} 
            clientName={client.name}
          />
        );

      case 'financial':
        return (
          <ClientFinancialDashboard 
            clientId={client.id} 
            clientName={client.name}
          />
        );

      case 'currency':
        return (
          <ClientCurrencyPreferences 
            clientId={client.id} 
            clientName={client.name}
          />
        );

      case 'communication':
        return (
          <ClientCommunication 
            clientId={client.id} 
          />
        );

      case 'invoices':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Recent Invoices</h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All Invoices
              </button>
            </div>

            {loadingInvoices ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices yet</h3>
                <p className="text-gray-600 mb-4">Create your first invoice for this client</p>
                <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  Create Invoice
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{invoice.invoice_number}</h4>
                        <p className="text-sm text-gray-600">
                          Created: {clientFormatters.formatDate(invoice.created_at)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Due: {clientFormatters.formatDate(invoice.due_date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {clientFormatters.formatCurrency(invoice.amount, client.default_currency)}
                        </p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          invoice.status === 'paid' 
                            ? 'bg-green-100 text-green-800'
                            : invoice.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {client.name}
            </h2>
            {client.company && client.company !== client.name && (
              <p className="text-sm text-gray-600">Company: {client.company}</p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              status.color === 'green' 
                ? 'bg-green-100 text-green-800' 
                : status.color === 'orange'
                ? 'bg-orange-100 text-orange-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {status.label}
            </span>
            <button
              onClick={onEdit}
              className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:text-blue-700 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 flex-shrink-0">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== null && tab.count > 0 && (
                    <span className="bg-gray-100 text-gray-600 ml-2 py-0.5 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}