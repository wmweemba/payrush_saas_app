'use client';

import React, { useState, useEffect } from 'react';
import { loadBranding } from '../../lib/pdf/templateService';

export default function TemplatePreview({ 
  template, 
  sampleData = {
    businessInfo: {
      name: 'Sample Business',
      address: '123 Business St',
      city: 'Business City',
      state: 'BC',
      zip: '12345',
      phone: '(555) 123-4567',
      email: 'contact@sample.com'
    },
    clientInfo: {
      name: 'Sample Client',
      email: 'client@example.com',
      address: '456 Client Ave',
      city: 'Client City',
      state: 'CC',
      zip: '67890'
    },
    invoiceData: {
      invoiceNumber: 'INV-001',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal: 1000,
      tax: 100,
      total: 1100,
      currency: 'USD'
    },
    lineItems: [
      {
        description: 'Sample Service 1',
        quantity: 2,
        rate: 300,
        amount: 600
      },
      {
        description: 'Sample Service 2',
        quantity: 1,
        rate: 400,
        amount: 400
      }
    ]
  },
  onTemplateChange,
  businessId
}) {
  const [branding, setBranding] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBranding = async () => {
      if (businessId) {
        try {
          const brandingData = await loadBranding(businessId);
          setBranding(brandingData);
        } catch (error) {
          console.warn('Could not load branding:', error);
        }
      }
      setLoading(false);
    };

    fetchBranding();
  }, [businessId]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center text-gray-500">
          <p>Select a template to preview</p>
        </div>
      </div>
    );
  }

  const getTemplateStyles = () => {
    const baseStyles = {
      fontFamily: template.typography?.fontFamily || 'Arial, sans-serif',
      fontSize: template.typography?.fontSize || '14px',
      lineHeight: template.typography?.lineHeight || '1.5'
    };

    if (template.layout?.colorScheme && branding?.primaryColor) {
      return {
        ...baseStyles,
        '--primary-color': branding.primaryColor,
        '--secondary-color': branding.secondaryColor || '#6b7280'
      };
    }

    return baseStyles;
  };

  const renderModernTemplate = () => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div 
        className="p-6 border-b"
        style={{ 
          backgroundColor: branding?.primaryColor || '#3b82f6',
          color: 'white'
        }}
      >
        <div className="flex justify-between items-start">
          <div>
            {branding?.logoUrl && (
              <img 
                src={branding.logoUrl} 
                alt="Business Logo" 
                className="h-12 w-auto mb-4"
              />
            )}
            <h1 className="text-2xl font-bold">{sampleData.businessInfo.name}</h1>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold">INVOICE</h2>
            <p className="text-sm opacity-90">#{sampleData.invoiceData.invoiceNumber}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Business Info */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">From:</h3>
            <div className="text-sm text-gray-600">
              <p>{sampleData.businessInfo.address}</p>
              <p>{sampleData.businessInfo.city}, {sampleData.businessInfo.state} {sampleData.businessInfo.zip}</p>
              <p>{sampleData.businessInfo.phone}</p>
              <p>{sampleData.businessInfo.email}</p>
            </div>
          </div>

          {/* Client Info */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">To:</h3>
            <div className="text-sm text-gray-600">
              <p className="font-medium">{sampleData.clientInfo.name}</p>
              <p>{sampleData.clientInfo.address}</p>
              <p>{sampleData.clientInfo.city}, {sampleData.clientInfo.state} {sampleData.clientInfo.zip}</p>
              <p>{sampleData.clientInfo.email}</p>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div>
            <p className="text-sm text-gray-500">Invoice Date</p>
            <p className="font-medium">{sampleData.invoiceData.invoiceDate}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Due Date</p>
            <p className="font-medium">{sampleData.invoiceData.dueDate}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Amount Due</p>
            <p className="font-bold text-lg" style={{ color: branding?.primaryColor || '#3b82f6' }}>
              {sampleData.invoiceData.currency} {sampleData.invoiceData.total.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b-2" style={{ borderColor: branding?.primaryColor || '#3b82f6' }}>
                <th className="text-left py-2 text-sm font-semibold text-gray-800">Description</th>
                <th className="text-right py-2 text-sm font-semibold text-gray-800">Qty</th>
                <th className="text-right py-2 text-sm font-semibold text-gray-800">Rate</th>
                <th className="text-right py-2 text-sm font-semibold text-gray-800">Amount</th>
              </tr>
            </thead>
            <tbody>
              {sampleData.lineItems.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-3 text-sm">{item.description}</td>
                  <td className="py-3 text-sm text-right">{item.quantity}</td>
                  <td className="py-3 text-sm text-right">{sampleData.invoiceData.currency} {item.rate.toFixed(2)}</td>
                  <td className="py-3 text-sm text-right font-medium">{sampleData.invoiceData.currency} {item.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-2">
              <span className="text-sm">Subtotal:</span>
              <span className="text-sm">{sampleData.invoiceData.currency} {sampleData.invoiceData.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm">Tax:</span>
              <span className="text-sm">{sampleData.invoiceData.currency} {sampleData.invoiceData.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-t border-gray-300 font-bold">
              <span>Total:</span>
              <span style={{ color: branding?.primaryColor || '#3b82f6' }}>
                {sampleData.invoiceData.currency} {sampleData.invoiceData.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderClassicTemplate = () => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b-2 border-gray-800">
        <div className="flex justify-between items-start">
          <div>
            {branding?.logoUrl && (
              <img 
                src={branding.logoUrl} 
                alt="Business Logo" 
                className="h-12 w-auto mb-4"
              />
            )}
            <h1 className="text-2xl font-bold text-gray-800">{sampleData.businessInfo.name}</h1>
            <div className="text-sm text-gray-600 mt-2">
              <p>{sampleData.businessInfo.address}</p>
              <p>{sampleData.businessInfo.city}, {sampleData.businessInfo.state} {sampleData.businessInfo.zip}</p>
              <p>{sampleData.businessInfo.phone} | {sampleData.businessInfo.email}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-gray-800">INVOICE</h2>
            <p className="text-lg font-medium">#{sampleData.invoiceData.invoiceNumber}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex justify-between mb-8">
          <div>
            <h3 className="font-bold text-gray-800 mb-2">BILL TO:</h3>
            <div className="text-sm">
              <p className="font-medium">{sampleData.clientInfo.name}</p>
              <p>{sampleData.clientInfo.address}</p>
              <p>{sampleData.clientInfo.city}, {sampleData.clientInfo.state} {sampleData.clientInfo.zip}</p>
              <p>{sampleData.clientInfo.email}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="mb-4">
              <p className="text-sm font-medium">Invoice Date: {sampleData.invoiceData.invoiceDate}</p>
              <p className="text-sm font-medium">Due Date: {sampleData.invoiceData.dueDate}</p>
            </div>
            <div className="bg-gray-100 p-4 rounded">
              <p className="text-sm font-medium">Amount Due</p>
              <p className="text-2xl font-bold text-gray-800">
                {sampleData.invoiceData.currency} {sampleData.invoiceData.total.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-8">
          <table className="w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-800 border-r border-gray-300">Description</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-800 border-r border-gray-300">Qty</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-800 border-r border-gray-300">Rate</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-800">Amount</th>
              </tr>
            </thead>
            <tbody>
              {sampleData.lineItems.map((item, index) => (
                <tr key={index} className="border-b border-gray-300">
                  <td className="py-3 px-4 border-r border-gray-300">{item.description}</td>
                  <td className="py-3 px-4 text-right border-r border-gray-300">{item.quantity}</td>
                  <td className="py-3 px-4 text-right border-r border-gray-300">{sampleData.invoiceData.currency} {item.rate.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-medium">{sampleData.invoiceData.currency} {item.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 border border-gray-300">
            <div className="flex justify-between py-2 px-4 bg-gray-50 border-b border-gray-300">
              <span className="font-medium">Subtotal:</span>
              <span>{sampleData.invoiceData.currency} {sampleData.invoiceData.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 px-4 bg-gray-50 border-b border-gray-300">
              <span className="font-medium">Tax:</span>
              <span>{sampleData.invoiceData.currency} {sampleData.invoiceData.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-3 px-4 bg-gray-800 text-white font-bold">
              <span>TOTAL:</span>
              <span>{sampleData.invoiceData.currency} {sampleData.invoiceData.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMinimalTemplate = () => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-8" style={getTemplateStyles()}>
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            {branding?.logoUrl && (
              <img 
                src={branding.logoUrl} 
                alt="Business Logo" 
                className="h-10 w-auto mb-4"
              />
            )}
            <h1 className="text-xl font-light text-gray-800">{sampleData.businessInfo.name}</h1>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-light text-gray-600">Invoice</h2>
            <p className="text-sm text-gray-500">#{sampleData.invoiceData.invoiceNumber}</p>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
          <div>
            <p className="font-medium text-gray-800">{sampleData.clientInfo.name}</p>
            <p className="text-gray-600">{sampleData.clientInfo.address}</p>
            <p className="text-gray-600">{sampleData.clientInfo.city}, {sampleData.clientInfo.state} {sampleData.clientInfo.zip}</p>
          </div>
          <div className="text-right text-gray-600">
            <p>Date: {sampleData.invoiceData.invoiceDate}</p>
            <p>Due: {sampleData.invoiceData.dueDate}</p>
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-8">
          <div className="border-b border-gray-200 pb-2 mb-4">
            <div className="grid grid-cols-4 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <div>Description</div>
              <div className="text-right">Qty</div>
              <div className="text-right">Rate</div>
              <div className="text-right">Amount</div>
            </div>
          </div>
          {sampleData.lineItems.map((item, index) => (
            <div key={index} className="grid grid-cols-4 gap-4 py-2 text-sm border-b border-gray-100">
              <div>{item.description}</div>
              <div className="text-right">{item.quantity}</div>
              <div className="text-right">{sampleData.invoiceData.currency} {item.rate.toFixed(2)}</div>
              <div className="text-right">{sampleData.invoiceData.currency} {item.amount.toFixed(2)}</div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex justify-end">
          <div className="w-48 text-sm">
            <div className="flex justify-between py-1">
              <span>Subtotal</span>
              <span>{sampleData.invoiceData.currency} {sampleData.invoiceData.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Tax</span>
              <span>{sampleData.invoiceData.currency} {sampleData.invoiceData.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-t border-gray-300 font-medium">
              <span>Total</span>
              <span>{sampleData.invoiceData.currency} {sampleData.invoiceData.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTemplate = () => {
    switch (template.name) {
      case 'Modern Professional':
        return renderModernTemplate();
      case 'Classic Business':
        return renderClassicTemplate();
      case 'Minimal Clean':
        return renderMinimalTemplate();
      default:
        return renderModernTemplate();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Template Preview</h3>
        {template && (
          <span className="text-sm text-gray-500">
            {template.name}
          </span>
        )}
      </div>
      
      <div className="transform scale-75 origin-top-left w-[133%]">
        {renderTemplate()}
      </div>
      
      {template && (
        <div className="text-xs text-gray-500 mt-4">
          <p>Preview shows how your invoice will look with current template and branding settings.</p>
        </div>
      )}
    </div>
  );
}