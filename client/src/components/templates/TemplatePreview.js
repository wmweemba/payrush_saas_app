'use client';

import { useState } from 'react';
import { ZoomIn, ZoomOut, Download, Maximize2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { formatCurrency } from '@/lib/utils';

export default function TemplatePreview({ templateData, invoiceData, profileData }) {
  const [zoom, setZoom] = useState(0.6);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.3));

  // Calculate totals
  const subtotal = invoiceData.line_items?.reduce((sum, item) => sum + item.total, 0) || invoiceData.amount;
  const total = subtotal; // Could add tax calculations here

  const previewStyle = {
    transform: `scale(${zoom})`,
    transformOrigin: 'top left',
    width: `${100 / zoom}%`,
    height: `${100 / zoom}%`
  };

  const InvoiceContent = () => (
    <div 
      className="bg-white shadow-lg"
      style={{
        width: '595px', // A4 width in pixels at 72 DPI
        minHeight: '842px', // A4 height in pixels at 72 DPI
        padding: `${templateData.layout.marginY}px ${templateData.layout.marginX}px`,
        fontFamily: templateData.fonts.body.family || 'Arial, sans-serif',
        color: templateData.colors.text
      }}
    >
      {/* Header Section */}
      <div 
        className="flex justify-between items-start mb-8"
        style={{ 
          minHeight: `${templateData.layout.headerHeight}px`,
          borderBottom: `2px solid ${templateData.colors.primary}`,
          paddingBottom: '16px'
        }}
      >
        <div>
          <h1 
            style={{ 
              fontSize: `${templateData.fonts.heading.size}px`,
              fontWeight: templateData.fonts.heading.weight,
              fontFamily: templateData.fonts.heading.family || templateData.fonts.body.family || 'Arial, sans-serif',
              lineHeight: templateData.fonts.heading.lineHeight || 1.2,
              letterSpacing: templateData.fonts.heading.letterSpacing ? `${templateData.fonts.heading.letterSpacing}px` : 'normal',
              textTransform: templateData.fonts.heading.textTransform || 'none',
              color: templateData.colors.primary,
              margin: 0,
              marginBottom: '8px'
            }}
          >
            INVOICE
          </h1>
          <div style={{ fontSize: `${templateData.fonts.body.size}px` }}>
            <strong>Invoice #:</strong> {invoiceData.id}
          </div>
          <div style={{ fontSize: `${templateData.fonts.body.size}px` }}>
            <strong>Date:</strong> {new Date(invoiceData.created_at).toLocaleDateString()}
          </div>
          <div style={{ fontSize: `${templateData.fonts.body.size}px` }}>
            <strong>Due Date:</strong> {new Date(invoiceData.due_date).toLocaleDateString()}
          </div>
        </div>
        <div className="text-right">
          <div 
            style={{ 
              fontSize: `${templateData.fonts.subheading.size}px`,
              fontWeight: templateData.fonts.subheading.weight,
              color: templateData.colors.primary,
              marginBottom: '8px'
            }}
          >
            {profileData.business_name}
          </div>
          <div style={{ fontSize: `${templateData.fonts.small.size}px`, lineHeight: '1.4' }}>
            {profileData.name}<br/>
            {profileData.phone}<br/>
            {profileData.address}<br/>
            {profileData.website}
          </div>
        </div>
      </div>

      {/* Bill To Section */}
      <div className="mb-8">
        <h2 
          style={{ 
            fontSize: `${templateData.fonts.subheading.size}px`,
            fontWeight: templateData.fonts.subheading.weight,
            fontFamily: templateData.fonts.subheading.family || templateData.fonts.body.family || 'Arial, sans-serif',
            lineHeight: templateData.fonts.subheading.lineHeight || 1.3,
            letterSpacing: templateData.fonts.subheading.letterSpacing ? `${templateData.fonts.subheading.letterSpacing}px` : 'normal',
            textTransform: templateData.fonts.subheading.textTransform || 'none',
            color: templateData.colors.primary,
            margin: 0,
            marginBottom: '8px'
          }}
        >
          BILL TO
        </h2>
        <div style={{ fontSize: `${templateData.fonts.body.size}px`, lineHeight: '1.4' }}>
          <strong>{invoiceData.customer_name}</strong><br/>
          {invoiceData.customer_email}
        </div>
      </div>

      {/* Line Items Table */}
      <div className="mb-8">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: templateData.colors.accent }}>
              <th style={{ 
                padding: '12px 8px', 
                textAlign: 'left', 
                fontSize: `${templateData.fonts.subheading.size}px`,
                fontWeight: templateData.fonts.subheading.weight,
                fontFamily: templateData.fonts.subheading.family || templateData.fonts.body.family || 'Arial, sans-serif',
                lineHeight: templateData.fonts.subheading.lineHeight || 1.3,
                color: templateData.colors.primary,
                borderBottom: `1px solid ${templateData.colors.secondary}`
              }}>
                Description
              </th>
              <th style={{ 
                padding: '12px 8px', 
                textAlign: 'center', 
                fontSize: `${templateData.fonts.subheading.size}px`,
                fontWeight: templateData.fonts.subheading.weight,
                color: templateData.colors.primary,
                borderBottom: `1px solid ${templateData.colors.secondary}`
              }}>
                Qty
              </th>
              <th style={{ 
                padding: '12px 8px', 
                textAlign: 'right', 
                fontSize: `${templateData.fonts.subheading.size}px`,
                fontWeight: templateData.fonts.subheading.weight,
                color: templateData.colors.primary,
                borderBottom: `1px solid ${templateData.colors.secondary}`
              }}>
                Rate
              </th>
              <th style={{ 
                padding: '12px 8px', 
                textAlign: 'right', 
                fontSize: `${templateData.fonts.subheading.size}px`,
                fontWeight: templateData.fonts.subheading.weight,
                color: templateData.colors.primary,
                borderBottom: `1px solid ${templateData.colors.secondary}`
              }}>
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoiceData.line_items?.map((item, index) => (
              <tr key={index}>
                <td style={{ 
                  padding: '8px', 
                  fontSize: `${templateData.fonts.body.size}px`,
                  borderBottom: `1px solid ${templateData.colors.accent}`
                }}>
                  {item.description}
                </td>
                <td style={{ 
                  padding: '8px', 
                  textAlign: 'center', 
                  fontSize: `${templateData.fonts.body.size}px`,
                  borderBottom: `1px solid ${templateData.colors.accent}`
                }}>
                  {item.quantity}
                </td>
                <td style={{ 
                  padding: '8px', 
                  textAlign: 'right', 
                  fontSize: `${templateData.fonts.body.size}px`,
                  borderBottom: `1px solid ${templateData.colors.accent}`
                }}>
                  {formatCurrency(item.unit_price, invoiceData.currency)}
                </td>
                <td style={{ 
                  padding: '8px', 
                  textAlign: 'right', 
                  fontSize: `${templateData.fonts.body.size}px`,
                  borderBottom: `1px solid ${templateData.colors.accent}`
                }}>
                  {formatCurrency(item.total, invoiceData.currency)}
                </td>
              </tr>
            )) || (
              <tr>
                <td style={{ 
                  padding: '8px', 
                  fontSize: `${templateData.fonts.body.size}px`,
                  borderBottom: `1px solid ${templateData.colors.accent}`
                }}>
                  Sample Service
                </td>
                <td style={{ 
                  padding: '8px', 
                  textAlign: 'center', 
                  fontSize: `${templateData.fonts.body.size}px`,
                  borderBottom: `1px solid ${templateData.colors.accent}`
                }}>
                  1
                </td>
                <td style={{ 
                  padding: '8px', 
                  textAlign: 'right', 
                  fontSize: `${templateData.fonts.body.size}px`,
                  borderBottom: `1px solid ${templateData.colors.accent}`
                }}>
                  {formatCurrency(invoiceData.amount, invoiceData.currency)}
                </td>
                <td style={{ 
                  padding: '8px', 
                  textAlign: 'right', 
                  fontSize: `${templateData.fonts.body.size}px`,
                  borderBottom: `1px solid ${templateData.colors.accent}`
                }}>
                  {formatCurrency(invoiceData.amount, invoiceData.currency)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="flex justify-end mb-8">
        <div style={{ width: '250px' }}>
          <div className="flex justify-between mb-2">
            <span style={{ fontSize: `${templateData.fonts.body.size}px` }}>Subtotal:</span>
            <span style={{ fontSize: `${templateData.fonts.body.size}px` }}>
              {formatCurrency(subtotal, invoiceData.currency)}
            </span>
          </div>
          <div 
            className="flex justify-between pt-2"
            style={{ 
              borderTop: `2px solid ${templateData.colors.primary}`,
              fontSize: `${templateData.fonts.subheading.size}px`,
              fontWeight: templateData.fonts.subheading.weight,
              color: templateData.colors.primary
            }}
          >
            <span>Total:</span>
            <span>{formatCurrency(total, invoiceData.currency)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div 
        className="text-center pt-4"
        style={{ 
          borderTop: `1px solid ${templateData.colors.secondary}`,
          fontSize: `${templateData.fonts.small.size}px`,
          color: templateData.colors.secondary
        }}
      >
        Thank you for your business!
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Preview Controls */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleZoomOut}
            disabled={zoom <= 0.3}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleZoomIn}
            disabled={zoom >= 2}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />
            PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Preview Container */}
      <div className="flex-1 overflow-auto bg-gray-100 rounded-lg">
        <div className="p-4">
          <div style={previewStyle}>
            <InvoiceContent />
          </div>
        </div>
      </div>
    </div>
  );
}