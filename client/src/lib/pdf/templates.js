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
 * Load branding data for static templates
 */
const loadBrandingData = async () => {
  try {
    const response = await fetch('/api/branding');
    if (response.ok) {
      const branding = await response.json();
      console.log('🎨 Loaded branding data:', branding);
      return branding;
    }
  } catch (error) {
    console.warn('Failed to load branding data:', error);
  }
  return null;
};

/**
 * Load image from URL for PDF
 */
const loadImageFromUrl = async (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      resolve({
        data: canvas.toDataURL('image/png'),
        width: img.width,
        height: img.height
      });
    };
    img.onerror = reject;
    img.src = url;
  });
};

/**
 * Generate PDF with specific template
 */
export const generateTemplatedPDF = async (invoice, profileData = {}, templateId = 'professional') => {
  console.log('🎨 generateTemplatedPDF called with templateId:', templateId);
  
  const jsPDF = (await import('jspdf')).default;
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  const template = getTemplateConfig(templateId);
  const currency = getCurrency(invoice.currency || 'USD');
  
  // Load branding data for logo support
  const brandingData = await loadBrandingData();
  let logoImage = null;
  
  if (brandingData?.logoUrl && brandingData?.showLogo) {
    try {
      logoImage = await loadImageFromUrl(brandingData.logoUrl);
      console.log('✅ Logo loaded successfully for static template');
    } catch (error) {
      console.warn('Failed to load logo for static template:', error);
    }
  }
  
  console.log('📐 Template config:', template);
  console.log('💰 Currency:', currency);
  console.log('🖼️ Logo available:', !!logoImage);
  
  // Template-specific rendering
  switch (templateId) {
    case 'minimal':
      console.log('🎯 Rendering MINIMAL template');
      return generateMinimalTemplate(pdf, invoice, profileData, template, currency, pageWidth, pageHeight, logoImage, brandingData);
    case 'modern':
      console.log('🎯 Rendering MODERN template');
      return generateModernTemplate(pdf, invoice, profileData, template, currency, pageWidth, pageHeight, logoImage, brandingData);
    case 'classic':
      console.log('🎯 Rendering CLASSIC template');
      return generateClassicTemplate(pdf, invoice, profileData, template, currency, pageWidth, pageHeight, logoImage, brandingData);
    default:
      console.log('🎯 Rendering PROFESSIONAL template (default)');
      return generateProfessionalTemplate(pdf, invoice, profileData, template, currency, pageWidth, pageHeight, logoImage, brandingData);
  }
};

/**
 * Professional Template
 */
const generateProfessionalTemplate = (pdf, invoice, profileData, template, currency, pageWidth, pageHeight, logoImage, brandingData) => {
  const primaryRgb = hexToRgb(template.colors.primary);
  
  console.log('💼 PROFESSIONAL template rendering');
  console.log('💼 Logo available:', !!logoImage);
  
  // Header with gradient effect - BLUE theme
  pdf.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  pdf.rect(0, 0, pageWidth, template.layout.headerHeight, 'F');
  
  // Add logo if available
  let logoWidth = 0;
  if (logoImage && brandingData?.showLogo) {
    try {
      const logoSize = 24;
      const logoX = template.layout.marginX;
      const logoY = 8;
      logoWidth = (logoImage.width / logoImage.height) * logoSize;
      
      pdf.addImage(logoImage.data, 'PNG', logoX, logoY, logoWidth, logoSize);
      console.log('💼 Logo added to professional template');
    } catch (error) {
      console.warn('💼 Failed to add logo to professional template:', error);
    }
  }
  
  // Add "PROFESSIONAL" label
  const textStartX = logoWidth > 0 ? template.layout.marginX + logoWidth + 10 : template.layout.marginX;
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.text('PROFESSIONAL TEMPLATE', textStartX, 10);
  
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
const generateMinimalTemplate = (pdf, invoice, profileData, template, currency, pageWidth, pageHeight, logoImage, brandingData) => {
  console.log('⚪ MINIMAL template rendering');
  console.log('⚪ Logo available:', !!logoImage);
  
  // MINIMAL: Absolutely clean design with tons of white space
  pdf.setTextColor(80, 80, 80); // Light gray text for minimal feel
  
  // Ultra-minimal identifier
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'normal');
  pdf.text('MINIMAL', pageWidth - 40, 15);
  
  // Add logo if available (very subtle placement)
  let logoWidth = 0;
  if (logoImage && brandingData?.showLogo) {
    try {
      const logoSize = 18; // Smaller for minimal design
      const logoX = 30;
      const logoY = 20;
      logoWidth = (logoImage.width / logoImage.height) * logoSize;
      
      pdf.addImage(logoImage.data, 'PNG', logoX, logoY, logoWidth, logoSize);
      console.log('⚪ Logo added to minimal template');
    } catch (error) {
      console.warn('⚪ Failed to add logo to minimal template:', error);
    }
  }
  
  // Minimal business name - very understated
  const textStartX = logoWidth > 0 ? 30 + logoWidth + 15 : 30;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text(profileData.business_name || 'Your Business', textStartX, 30);
  
  // Ultra-minimal "Invoice" text
  pdf.setTextColor(150, 150, 150);
  pdf.setFontSize(10);
  pdf.text('Invoice', 30, 55);
  
  // Customer with lots of space
  let currentY = 80;
  pdf.setTextColor(100, 100, 100);
  pdf.setFontSize(9);
  pdf.text('To:', 30, currentY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(invoice.customer_name || 'Customer', 30, currentY + 12);
  if (invoice.customer_email) {
    pdf.text(invoice.customer_email, 30, currentY + 22);
  }
  
  currentY += 50; // Lots of white space
  
  // MINIMAL: Clean line items without any borders
  pdf.setTextColor(120, 120, 120);
  pdf.setFontSize(8);
  pdf.text('DESCRIPTION', 30, currentY);
  pdf.text('QTY', pageWidth - 120, currentY);
  pdf.text('RATE', pageWidth - 80, currentY);
  pdf.text('AMOUNT', pageWidth - 30, currentY, { align: 'right' });
  
  currentY += 15;
  
  // Ultra-minimal line - just a thin line
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.2);
  pdf.line(30, currentY, pageWidth - 30, currentY);
  
  currentY += 10;
  
  // Line items - clean and spacious
  if (invoice.line_items && invoice.line_items.length > 0) {
    invoice.line_items.forEach((item, index) => {
      pdf.setTextColor(60, 60, 60);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      pdf.text(item.description || 'Item', 30, currentY);
      pdf.text((item.quantity || 1).toString(), pageWidth - 120, currentY);
      pdf.text(formatCurrency(item.unit_price || 0, invoice.currency), pageWidth - 80, currentY);
      pdf.text(formatCurrency(item.total || (item.quantity * item.unit_price) || 0, invoice.currency), pageWidth - 30, currentY, { align: 'right' });
      
      currentY += 15; // Generous spacing
    });
  } else {
    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    
    pdf.text(invoice.description || 'Invoice Payment', 30, currentY);
    pdf.text('1', pageWidth - 120, currentY);
    pdf.text(formatCurrency(invoice.amount, invoice.currency), pageWidth - 80, currentY);
    pdf.text(formatCurrency(invoice.amount, invoice.currency), pageWidth - 30, currentY, { align: 'right' });
    
    currentY += 15;
  }
  
  currentY += 20; // More white space
  
  // MINIMAL: Super clean total
  pdf.setDrawColor(180, 180, 180);
  pdf.setLineWidth(0.3);
  pdf.line(pageWidth - 100, currentY, pageWidth - 30, currentY);
  
  currentY += 8;
  
  pdf.setTextColor(40, 40, 40);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Total', pageWidth - 100, currentY);
  pdf.setFont('helvetica', 'bold');
  pdf.text(formatCurrency(invoice.amount, invoice.currency), pageWidth - 30, currentY, { align: 'right' });
  
  // Minimal currency info - very subtle
  currentY += 30;
  pdf.setTextColor(160, 160, 160);
  pdf.setFontSize(7);
  pdf.text(`${currency.code} ${currency.flag}`, 30, currentY);
  
  // Ultra-minimal footer
  const footerY = pageHeight - 30;
  pdf.setTextColor(180, 180, 180);
  pdf.setFontSize(6);
  pdf.text('PayRush', pageWidth / 2, footerY, { align: 'center' });
  
  return pdf;
};

/**
 * Modern Template
 */
const generateModernTemplate = (pdf, invoice, profileData, template, currency, pageWidth, pageHeight, logoImage, brandingData) => {
  const primaryRgb = hexToRgb(template.colors.primary);
  const secondaryRgb = hexToRgb(template.colors.secondary);
  
  console.log('🎨 MODERN template colors:', template.colors);
  console.log('🎨 Logo available:', !!logoImage);
  
  // MODERN: Purple gradient header - MUCH TALLER
  const headerHeight = 60; // Bigger header
  pdf.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  pdf.rect(0, 0, pageWidth, headerHeight, 'F');
  
  // Add gradient effect with lighter purple
  pdf.setFillColor(primaryRgb.r + 30, primaryRgb.g + 30, primaryRgb.b + 30);
  pdf.rect(0, 0, pageWidth, headerHeight / 2, 'F');
  
  // MODERN: Geometric decorative elements
  pdf.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
  
  // Large circle
  pdf.circle(pageWidth - 40, 20, 15, 'F');
  // Square
  pdf.rect(pageWidth - 80, 10, 20, 20, 'F');
  // Triangle (using lines)
  pdf.setFillColor(255, 255, 255);
  pdf.circle(pageWidth - 40, 20, 8, 'F');
  
  // Add logo if available
  let logoWidth = 0;
  if (logoImage && brandingData?.showLogo) {
    try {
      const logoSize = 25;
      const logoX = template.layout.marginX;
      const logoY = 8;
      logoWidth = (logoImage.width / logoImage.height) * logoSize;
      
      pdf.addImage(logoImage.data, 'PNG', logoX, logoY, logoWidth, logoSize);
      console.log('🎨 Logo added to modern template');
    } catch (error) {
      console.warn('🎨 Failed to add logo to modern template:', error);
    }
  }
  
  // MODERN: Large, bold typography
  const textStartX = logoWidth > 0 ? template.layout.marginX + logoWidth + 15 : template.layout.marginX;
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(36); // Much larger
  pdf.setFont('helvetica', 'bold');
  pdf.text('MODERN INVOICE', textStartX, 35);
  
  // MODERN template label
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255);
  pdf.text('MODERN TEMPLATE', textStartX, 15);
  
  // Company name in header
  pdf.setFontSize(16);
  pdf.text(profileData.business_name || 'Your Business', textStartX, 50);
  
  // Start content lower due to bigger header
  let currentY = headerHeight + 20;
  
  // MODERN: Colored section headers
  pdf.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b, 0.1);
  pdf.rect(template.layout.marginX, currentY, pageWidth - (template.layout.marginX * 2), 25, 'F');
  
  // Invoice details with modern styling
  pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`INVOICE #${invoice.id?.slice(0, 8) || 'N/A'}`, pageWidth - template.layout.marginX, currentY + 15, { align: 'right' });
  
  currentY += 35;
  
  // From/To section with modern layout
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('FROM:', template.layout.marginX, currentY);
  pdf.text('TO:', pageWidth - 80, currentY);
  
  currentY += 8;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(profileData.business_name || 'Your Business', template.layout.marginX, currentY);
  pdf.text(invoice.customer_name || 'Customer', pageWidth - 80, currentY);
  
  if (invoice.customer_email) {
    currentY += 5;
    pdf.text(invoice.customer_email, pageWidth - 80, currentY);
  }
  
  currentY += 20;
  
  // MODERN: Invoice items with purple theme
  pdf.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  pdf.rect(template.layout.marginX, currentY, pageWidth - (template.layout.marginX * 2), 12, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DESCRIPTION', template.layout.marginX + 5, currentY + 8);
  pdf.text('QTY', pageWidth - 80, currentY + 8, { align: 'center' });
  pdf.text('RATE', pageWidth - 50, currentY + 8, { align: 'center' });
  pdf.text('AMOUNT', pageWidth - template.layout.marginX, currentY + 8, { align: 'right' });
  
  currentY += 15;
  
  // Line items
  if (invoice.line_items && invoice.line_items.length > 0) {
    invoice.line_items.forEach((item, index) => {
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      pdf.text(item.description || 'Item', template.layout.marginX + 5, currentY);
      pdf.text((item.quantity || 1).toString(), pageWidth - 80, currentY, { align: 'center' });
      pdf.text(formatCurrency(item.unit_price || 0, invoice.currency), pageWidth - 50, currentY, { align: 'center' });
      pdf.text(formatCurrency(item.total || (item.quantity * item.unit_price) || 0, invoice.currency), pageWidth - template.layout.marginX, currentY, { align: 'right' });
      currentY += 8;
    });
  } else {
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    pdf.text(invoice.description || 'Invoice Payment', template.layout.marginX + 5, currentY);
    pdf.text('1', pageWidth - 80, currentY, { align: 'center' });
    pdf.text(formatCurrency(invoice.amount, invoice.currency), pageWidth - 50, currentY, { align: 'center' });
    pdf.text(formatCurrency(invoice.amount, invoice.currency), pageWidth - template.layout.marginX, currentY, { align: 'right' });
    currentY += 8;
  }
  
  currentY += 15;
  
  // MODERN: Total with purple background
  pdf.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  pdf.rect(pageWidth - 100, currentY, 80, 15, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTAL:', pageWidth - 90, currentY + 10);
  pdf.text(formatCurrency(invoice.amount, invoice.currency), pageWidth - template.layout.marginX, currentY + 10, { align: 'right' });
  
  // Currency info
  currentY += 25;
  pdf.setTextColor(100, 100, 100);
  pdf.setFontSize(8);
  pdf.text(`Currency: ${currency.name} (${currency.code}) ${currency.flag}`, template.layout.marginX, currentY);
  
  // MODERN: Purple footer
  const footerY = pageHeight - 40;
  pdf.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  pdf.rect(0, footerY, pageWidth, 40, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.text('Thank you for your business!', pageWidth / 2, footerY + 15, { align: 'center' });
  pdf.setFontSize(8);
  pdf.text('Generated by PayRush - Professional Invoice Management', pageWidth / 2, footerY + 25, { align: 'center' });
  
  return pdf;
};

/**
 * Classic Template
 */
const generateClassicTemplate = (pdf, invoice, profileData, template, currency, pageWidth, pageHeight, logoImage, brandingData) => {
  console.log('📜 CLASSIC template rendering - SHOULD HAVE DOUBLE BORDERS!');
  console.log('📜 Classic template parameters:', { pageWidth, pageHeight, customerName: invoice.customer_name });
  console.log('📜 Logo available:', !!logoImage);
  
  // CLASSIC: Very distinctive double border frame - BLACK AND THICK
  console.log('📜 Drawing outer border...');
  pdf.setDrawColor(0, 0, 0);  // Pure black
  pdf.setLineWidth(3);  // Thick border
  pdf.rect(5, 5, pageWidth - 10, pageHeight - 10);
  
  // Inner decorative border
  console.log('📜 Drawing inner border...');
  pdf.setLineWidth(1);
  pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);
  
  // CLASSIC: Ornate inner border
  console.log('📜 Drawing ornate border...');
  pdf.setLineWidth(0.5);
  pdf.rect(15, 15, pageWidth - 30, pageHeight - 30);
  
  // CLASSIC: Traditional header section with heavy border
  console.log('📜 Drawing header section...');
  pdf.setLineWidth(2);
  pdf.rect(20, 20, pageWidth - 40, 60);
  
  // Add logo if available
  let logoWidth = 0;
  if (logoImage && brandingData?.showLogo) {
    try {
      const logoSize = 20;
      const logoX = 25;
      const logoY = 22;
      logoWidth = (logoImage.width / logoImage.height) * logoSize;
      
      pdf.addImage(logoImage.data, 'PNG', logoX, logoY, logoWidth, logoSize);
      console.log('📜 Logo added to classic template');
    } catch (error) {
      console.warn('📜 Failed to add logo to classic template:', error);
    }
  }
  
  // Classic header content
  const textStartX = logoWidth > 0 ? 25 + logoWidth + 10 : 25;
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  pdf.text('🏛️ CLASSIC TEMPLATE 🏛️', textStartX, 30);
  
  // Business name in classic serif style
  pdf.setFontSize(16);
  pdf.setFont('times', 'bold');
  pdf.text(profileData.business_name || 'Your Business', textStartX, 45);
  
  // Traditional underline
  pdf.setLineWidth(1);
  pdf.line(25, 50, pageWidth - 25, 50);
  
  // "INVOICE" in classic style with box
  pdf.setLineWidth(2);
  pdf.rect(pageWidth - 80, 25, 55, 20);
  pdf.setFillColor(0, 0, 0);
  pdf.rect(pageWidth - 80, 25, 55, 20, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.setFont('times', 'bold');
  pdf.text('INVOICE', pageWidth - 75, 38);
  
  console.log('📜 Classic template header complete');
  
  // Start content after the header box
  let currentY = 90;
  
  // CLASSIC: Invoice details in formal layout
  pdf.setFont('times', 'normal');
  pdf.setFontSize(10);
  
  // Formal sections with boxes
  pdf.setLineWidth(1);
  pdf.rect(25, currentY, (pageWidth - 50) / 2 - 5, 40);
  pdf.rect(25 + (pageWidth - 50) / 2 + 5, currentY, (pageWidth - 50) / 2 - 5, 40);
  
  // From section
  pdf.setFont('times', 'bold');
  pdf.text('FROM:', 30, currentY + 10);
  pdf.setFont('times', 'normal');
  pdf.text(profileData.business_name || 'Your Business', 30, currentY + 20);
  
  // To section
  pdf.setFont('times', 'bold');
  pdf.text('TO:', 30 + (pageWidth - 50) / 2 + 10, currentY + 10);
  pdf.setFont('times', 'normal');
  pdf.text(invoice.customer_name || 'Customer', 30 + (pageWidth - 50) / 2 + 10, currentY + 20);
  if (invoice.customer_email) {
    pdf.text(invoice.customer_email, 30 + (pageWidth - 50) / 2 + 10, currentY + 30);
  }
  
  currentY += 50;
  
  // CLASSIC: Formal table with full borders
  pdf.setLineWidth(1);
  pdf.rect(25, currentY, pageWidth - 50, 15);
  
  // Table header with classic styling
  pdf.setFillColor(240, 240, 240);
  pdf.rect(25, currentY, pageWidth - 50, 15, 'F');
  
  pdf.setFont('times', 'bold');
  pdf.setFontSize(10);
  pdf.text('DESCRIPTION', 30, currentY + 10);
  pdf.text('QTY', pageWidth - 120, currentY + 10);
  pdf.text('RATE', pageWidth - 80, currentY + 10);
  pdf.text('AMOUNT', pageWidth - 40, currentY + 10);
  
  // Draw vertical lines for table columns
  pdf.line(pageWidth - 130, currentY, pageWidth - 130, currentY + 15);
  pdf.line(pageWidth - 90, currentY, pageWidth - 90, currentY + 15);
  pdf.line(pageWidth - 50, currentY, pageWidth - 50, currentY + 15);
  
  currentY += 15;
  
  // Line items with full table borders
  if (invoice.line_items && invoice.line_items.length > 0) {
    invoice.line_items.forEach((item, index) => {
      pdf.setFont('times', 'normal');
      pdf.rect(25, currentY, pageWidth - 50, 12);
      
      pdf.text(item.description || 'Item', 30, currentY + 8);
      pdf.text((item.quantity || 1).toString(), pageWidth - 125, currentY + 8);
      pdf.text(formatCurrency(item.unit_price || 0, invoice.currency), pageWidth - 85, currentY + 8);
      pdf.text(formatCurrency(item.total || (item.quantity * item.unit_price) || 0, invoice.currency), pageWidth - 45, currentY + 8);
      
      // Vertical lines
      pdf.line(pageWidth - 130, currentY, pageWidth - 130, currentY + 12);
      pdf.line(pageWidth - 90, currentY, pageWidth - 90, currentY + 12);
      pdf.line(pageWidth - 50, currentY, pageWidth - 50, currentY + 12);
      
      currentY += 12;
    });
  } else {
    pdf.setFont('times', 'normal');
    pdf.rect(25, currentY, pageWidth - 50, 12);
    
    pdf.text(invoice.description || 'Invoice Payment', 30, currentY + 8);
    pdf.text('1', pageWidth - 125, currentY + 8);
    pdf.text(formatCurrency(invoice.amount, invoice.currency), pageWidth - 85, currentY + 8);
    pdf.text(formatCurrency(invoice.amount, invoice.currency), pageWidth - 45, currentY + 8);
    
    // Vertical lines
    pdf.line(pageWidth - 130, currentY, pageWidth - 130, currentY + 12);
    pdf.line(pageWidth - 90, currentY, pageWidth - 90, currentY + 12);
    pdf.line(pageWidth - 50, currentY, pageWidth - 50, currentY + 12);
    
    currentY += 12;
  }
  
  currentY += 15;
  
  // CLASSIC: Total in formal box
  pdf.setLineWidth(2);
  pdf.rect(pageWidth - 100, currentY, 75, 20);
  
  pdf.setFillColor(0, 0, 0);
  pdf.rect(pageWidth - 100, currentY, 75, 20, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(12);
  pdf.text('TOTAL:', pageWidth - 90, currentY + 13);
  pdf.text(formatCurrency(invoice.amount, invoice.currency), pageWidth - 30, currentY + 13, { align: 'right' });
  
  // CLASSIC: Formal signature line
  currentY += 40;
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('times', 'normal');
  pdf.setFontSize(10);
  pdf.line(25, currentY + 20, 100, currentY + 20);
  pdf.text('Authorized Signature', 25, currentY + 30);
  
  // Currency info
  pdf.setFontSize(8);
  pdf.text(`Currency: ${currency.name} (${currency.code}) ${currency.flag}`, 25, currentY + 40);
  
  // CLASSIC: Formal footer with border
  const footerY = pageHeight - 40;
  pdf.setLineWidth(1);
  pdf.rect(20, footerY, pageWidth - 40, 25);
  
  pdf.setFontSize(9);
  pdf.text('Thank you for your business!', pageWidth / 2, footerY + 10, { align: 'center' });
  pdf.setFontSize(7);
  pdf.text('Generated by PayRush - Professional Invoice Management', pageWidth / 2, footerY + 18, { align: 'center' });
  
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

/**
 * Test function to verify template differences
 */
export const testTemplateGeneration = async () => {
  const testInvoice = {
    id: 'test-123',
    customer_name: 'Test Customer',
    customer_email: 'test@example.com',
    amount: 1000,
    currency: 'USD',
    status: 'sent',
    due_date: '2025-12-01',
    created_at: new Date().toISOString()
  };
  
  const testProfile = {
    business_name: 'Test Business',
    name: 'Test User'
  };
  
  console.log('🧪 Testing template generation...');
  
  const templates = ['professional', 'minimal', 'modern', 'classic'];
  
  for (const templateId of templates) {
    console.log(`🎨 Testing template: ${templateId}`);
    try {
      const pdf = await generateTemplatedPDF(testInvoice, testProfile, templateId);
      console.log(`✅ ${templateId} template generated successfully`);
    } catch (error) {
      console.error(`❌ ${templateId} template failed:`, error);
    }
  }
  
  console.log('🧪 Template testing complete!');
};

export default {
  INVOICE_TEMPLATES,
  getTemplateConfig,
  generateTemplatedPDF,
  testTemplateGeneration
};