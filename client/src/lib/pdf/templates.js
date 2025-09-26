/**
 * Invoice Template System for PayRush
 * Provides customizable invoice templates with different layouts and branding
 */

import { formatCurrency, getCurrency } from '@/lib/currency/currencies';

/**
 * Available invoice templates
 */
export const INVOICE_TEMPLATES = {
  PROFESSIONAL: {
    id: 'professional',
    name: 'Professional',
    description: 'Clean, modern design suitable for businesses',
    preview: '📊 Professional Layout'
  },
  MINIMAL: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and clean design with essential information',
    preview: '📄 Minimal Layout'
  },
  MODERN: {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary design with bold colors and typography',
    preview: '🎨 Modern Layout'
  },
  CLASSIC: {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional business invoice layout',
    preview: '📜 Classic Layout'
  }
};

/**
 * Template configuration for PDF generation
 */
export const getTemplateConfig = (templateId) => {
  const templates = {
    professional: {
      colors: {
        primary: '#2563eb',
        secondary: '#64748b',
        text: '#1f2937',
        accent: '#f8fafc'
      },
      fonts: {
        heading: { size: 24, weight: 'bold' },
        subheading: { size: 12, weight: 'bold' },
        body: { size: 10, weight: 'normal' },
        small: { size: 8, weight: 'normal' }
      },
      layout: {
        headerHeight: 40,
        marginX: 20,
        marginY: 20
      }
    },
    minimal: {
      colors: {
        primary: '#000000',
        secondary: '#666666',
        text: '#333333',
        accent: '#f9f9f9'
      },
      fonts: {
        heading: { size: 20, weight: 'normal' },
        subheading: { size: 11, weight: 'normal' },
        body: { size: 9, weight: 'normal' },
        small: { size: 7, weight: 'normal' }
      },
      layout: {
        headerHeight: 30,
        marginX: 25,
        marginY: 25
      }
    },
    modern: {
      colors: {
        primary: '#7c3aed',
        secondary: '#a855f7',
        text: '#1e1b4b',
        accent: '#faf5ff'
      },
      fonts: {
        heading: { size: 28, weight: 'bold' },
        subheading: { size: 13, weight: 'bold' },
        body: { size: 11, weight: 'normal' },
        small: { size: 9, weight: 'normal' }
      },
      layout: {
        headerHeight: 50,
        marginX: 15,
        marginY: 15
      }
    },
    classic: {
      colors: {
        primary: '#1f2937',
        secondary: '#4b5563',
        text: '#374151',
        accent: '#f3f4f6'
      },
      fonts: {
        heading: { size: 22, weight: 'bold' },
        subheading: { size: 12, weight: 'bold' },
        body: { size: 10, weight: 'normal' },
        small: { size: 8, weight: 'normal' }
      },
      layout: {
        headerHeight: 35,
        marginX: 20,
        marginY: 20
      }
    }
  };
  
  return templates[templateId] || templates.professional;
};

/**
 * Generate PDF with specific template
 */
export const generateTemplatedPDF = async (invoice, profileData = {}, templateId = 'professional') => {
  const jsPDF = (await import('jspdf')).default;
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  const template = getTemplateConfig(templateId);
  const currency = getCurrency(invoice.currency || 'USD');
  
  // Helper function to convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };
  
  const primaryRgb = hexToRgb(template.colors.primary);
  const secondaryRgb = hexToRgb(template.colors.secondary);
  const textRgb = hexToRgb(template.colors.text);
  
  // Template-specific rendering
  switch (templateId) {
    case 'minimal':
      return generateMinimalTemplate(pdf, invoice, profileData, template, currency, pageWidth, pageHeight);
    case 'modern':
      return generateModernTemplate(pdf, invoice, profileData, template, currency, pageWidth, pageHeight);
    case 'classic':
      return generateClassicTemplate(pdf, invoice, profileData, template, currency, pageWidth, pageHeight);
    default:
      return generateProfessionalTemplate(pdf, invoice, profileData, template, currency, pageWidth, pageHeight);
  }
};

/**
 * Professional Template
 */
const generateProfessionalTemplate = (pdf, invoice, profileData, template, currency, pageWidth, pageHeight) => {
  const primaryRgb = hexToRgb(template.colors.primary);
  
  // Header with gradient effect
  pdf.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  pdf.rect(0, 0, pageWidth, template.layout.headerHeight, 'F');
  
  // Company name
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(template.fonts.heading.size);
  pdf.setFont('helvetica', template.fonts.heading.weight);
  pdf.text('PayRush', template.layout.marginX, 25);
  
  // Business name
  pdf.setFontSize(template.fonts.body.size);
  pdf.setFont('helvetica', template.fonts.body.weight);
  pdf.text(profileData.business_name || 'Your Business', template.layout.marginX, 35);
  
  // Invoice title with styling
  pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  pdf.setFontSize(32);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE', pageWidth - template.layout.marginX, 25, { align: 'right' });
  
  // Continue with rest of the invoice...
  renderInvoiceContent(pdf, invoice, profileData, template, currency, pageWidth, pageHeight);
  
  return pdf;
};

/**
 * Minimal Template
 */
const generateMinimalTemplate = (pdf, invoice, profileData, template, currency, pageWidth, pageHeight) => {
  // Simple header line
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  pdf.line(template.layout.marginX, 20, pageWidth - template.layout.marginX, 20);
  
  // Company info
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(template.fonts.heading.size);
  pdf.setFont('helvetica', template.fonts.heading.weight);
  pdf.text(profileData.business_name || 'Your Business', template.layout.marginX, 35);
  
  // Invoice title
  pdf.setFontSize(template.fonts.heading.size);
  pdf.text('Invoice', pageWidth - template.layout.marginX, 35, { align: 'right' });
  
  renderInvoiceContent(pdf, invoice, profileData, template, currency, pageWidth, pageHeight);
  
  return pdf;
};

/**
 * Modern Template
 */
const generateModernTemplate = (pdf, invoice, profileData, template, currency, pageWidth, pageHeight) => {
  const primaryRgb = hexToRgb(template.colors.primary);
  const secondaryRgb = hexToRgb(template.colors.secondary);
  
  // Gradient-like header with shapes
  pdf.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  pdf.rect(0, 0, pageWidth, template.layout.headerHeight, 'F');
  
  // Accent shapes
  pdf.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
  pdf.circle(pageWidth - 30, 15, 8, 'F');
  pdf.triangle(pageWidth - 50, 10, pageWidth - 45, 20, pageWidth - 55, 20, 'F');
  
  // Modern typography
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(template.fonts.heading.size);
  pdf.setFont('helvetica', template.fonts.heading.weight);
  pdf.text('PAYRUSH', template.layout.marginX, 30);
  
  renderInvoiceContent(pdf, invoice, profileData, template, currency, pageWidth, pageHeight);
  
  return pdf;
};

/**
 * Classic Template
 */
const generateClassicTemplate = (pdf, invoice, profileData, template, currency, pageWidth, pageHeight) => {
  // Traditional border
  pdf.setDrawColor(100, 100, 100);
  pdf.setLineWidth(2);
  pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);
  
  // Inner border
  pdf.setLineWidth(0.5);
  pdf.rect(15, 15, pageWidth - 30, pageHeight - 30);
  
  // Classic header
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(template.fonts.heading.size);
  pdf.setFont('helvetica', template.fonts.heading.weight);
  pdf.text(profileData.business_name || 'Your Business', template.layout.marginX, 40);
  
  // Underline
  pdf.setLineWidth(1);
  pdf.line(template.layout.marginX, 45, pageWidth - template.layout.marginX, 45);
  
  renderInvoiceContent(pdf, invoice, profileData, template, currency, pageWidth, pageHeight);
  
  return pdf;
};

/**
 * Common invoice content rendering
 */
const renderInvoiceContent = (pdf, invoice, profileData, template, currency, pageWidth, pageHeight) => {
  const textRgb = hexToRgb(template.colors.text);
  const secondaryRgb = hexToRgb(template.colors.secondary);
  
  let currentY = template.layout.headerHeight + 30;
  
  // Invoice details
  pdf.setTextColor(textRgb.r, textRgb.g, textRgb.b);
  pdf.setFontSize(template.fonts.body.size);
  pdf.setFont('helvetica', template.fonts.body.weight);
  
  pdf.text(`Invoice #${invoice.id?.slice(0, 8) || 'DRAFT'}`, pageWidth - template.layout.marginX, currentY, { align: 'right' });
  pdf.text(`Date: ${new Date(invoice.created_at || new Date()).toLocaleDateString()}`, pageWidth - template.layout.marginX, currentY + 5, { align: 'right' });
  pdf.text(`Due: ${new Date(invoice.due_date).toLocaleDateString()}`, pageWidth - template.layout.marginX, currentY + 10, { align: 'right' });
  
  // Customer details
  currentY += 20;
  pdf.setFontSize(template.fonts.subheading.size);
  pdf.setFont('helvetica', template.fonts.subheading.weight);
  pdf.text('Bill To:', template.layout.marginX, currentY);
  
  currentY += 8;
  pdf.setFontSize(template.fonts.body.size);
  pdf.setFont('helvetica', template.fonts.body.weight);
  pdf.text(invoice.customer_name || 'Customer', template.layout.marginX, currentY);
  
  if (invoice.customer_email) {
    currentY += 5;
    pdf.text(invoice.customer_email, template.layout.marginX, currentY);
  }
  
  // Invoice total
  currentY += 30;
  pdf.setFontSize(template.fonts.heading.size);
  pdf.setFont('helvetica', template.fonts.heading.weight);
  pdf.text('Total: ' + formatCurrency(invoice.amount, invoice.currency), pageWidth - template.layout.marginX, currentY, { align: 'right' });
  
  // Footer
  const footerY = pageHeight - 30;
  pdf.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
  pdf.setFontSize(template.fonts.small.size);
  pdf.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });
};

/**
 * Helper function for hex to RGB conversion
 */
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

export default {
  INVOICE_TEMPLATES,
  getTemplateConfig,
  generateTemplatedPDF
};