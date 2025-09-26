'use client';

import { useState, useEffect } from 'react';
import { clientFormatters } from '@/lib/clientService';

export default function ClientProfile({ client, onEdit, onClose }) {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {client.company_name}
            </h2>
            {client.contact_person && (
              <p className="text-sm text-gray-600">Contact: {client.contact_person}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Status and Actions */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                status.color === 'green' 
                  ? 'bg-green-100 text-green-800' 
                  : status.color === 'orange'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {status.label}
              </span>
              {client.tags && client.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {client.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => onEdit(client)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Edit Client
            </button>
          </div>

          {/* Client Information Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <div className="mt-1 text-sm text-gray-900">{client.email}</div>
              </div>

              {client.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Phone</label>
                  <div className="mt-1 text-sm text-gray-900">{client.phone}</div>
                </div>
              )}

              {client.website && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Website</label>
                  <div className="mt-1 text-sm text-gray-900">
                    <a 
                      href={client.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {client.website}
                    </a>
                  </div>
                </div>
              )}

              {client.tax_number && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Tax Number</label>
                  <div className="mt-1 text-sm text-gray-900">{client.tax_number}</div>
                </div>
              )}
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Address</h3>
              
              {clientFormatters.formatAddress(client) ? (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Address</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {clientFormatters.formatAddress(client)}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No address on file</div>
              )}
            </div>

            {/* Business Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Business Settings</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Default Currency</label>
                <div className="mt-1 text-sm text-gray-900">{client.default_currency}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Payment Terms</label>
                <div className="mt-1 text-sm text-gray-900">
                  {clientFormatters.formatPaymentTerms(client.payment_terms || 30)}
                </div>
              </div>

              {client.discount_rate > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Default Discount</label>
                  <div className="mt-1 text-sm text-gray-900">{client.discount_rate}%</div>
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Financial Summary</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Total Invoiced</label>
                <div className="mt-1 text-sm text-gray-900">
                  {clientFormatters.formatCurrency(
                    client.total_invoiced || 0,
                    client.default_currency
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Total Paid</label>
                <div className="mt-1 text-sm text-gray-900">
                  {clientFormatters.formatCurrency(
                    client.total_paid || 0,
                    client.default_currency
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Outstanding Balance</label>
                <div className={`mt-1 text-sm font-medium ${
                  (client.outstanding_balance || 0) > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {clientFormatters.formatCurrency(
                    client.outstanding_balance || 0,
                    client.default_currency
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Total Invoices</label>
                <div className="mt-1 text-sm text-gray-900">{client.invoice_count || 0}</div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {client.notes && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{client.notes}</p>
              </div>
            </div>
          )}

          {/* Recent Invoices */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
              <button className="text-blue-600 hover:text-blue-800 text-sm">
                View All Invoices
              </button>
            </div>

            {loadingInvoices ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading invoices...</span>
              </div>
            ) : invoices.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-500">No invoices for this client yet</p>
                <button className="mt-2 text-blue-600 hover:text-blue-800 text-sm">
                  Create First Invoice
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Invoice
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Due Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-100">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {invoice.invoice_number}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {clientFormatters.formatCurrency(invoice.amount, client.default_currency)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            invoice.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : invoice.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(invoice.due_date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-500">
              <div>
                Created: {new Date(client.created_at).toLocaleString()}
              </div>
              {client.updated_at && (
                <div>
                  Last Updated: {new Date(client.updated_at).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}