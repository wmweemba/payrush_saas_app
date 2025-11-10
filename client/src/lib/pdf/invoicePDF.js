/**
 * PDF Invoice Generation for PayRush
 * Generates professional invoices with multi-currency support
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatCurrency, getCurrency } from '@/lib/currency/currencies';
import { generateTemplatedPDF, INVOICE_TEMPLATES } from './templates';
import { getTemplateForPDF, getUserDefaultTemplate, recordTemplateUsage } from './templateService';

/**
 * Generate PDF invoice from invoice data with database template support
 */
export const generateInvoicePDF = async (invoice, profileData = {}, templateId = null) => {
  try {
    console.log('🎨 PDF Generation started with templateId:', templateId);
    
    // Check if templateId is a static template type
    const staticTemplateTypes = ['professional', 'minimal', 'modern', 'classic'];
    
    if (templateId && staticTemplateTypes.includes(templateId)) {
      console.log('🎯 Using static template directly:', templateId);
      return await generateTemplatedPDF(invoice, profileData, templateId);
    }
    
    // If we have a UUID-like templateId, try to use database template
    if (templateId && templateId !== 'default' && templateId !== null && templateId.length > 10 && templateId.includes('-')) {
      try {
        console.log('📋 Fetching database template:', templateId);
        const templateConfig = await getTemplateForPDF(templateId);
        
        if (templateConfig && templateConfig.id && !templateConfig.isStatic) {
          console.log('✅ Using database template:', templateConfig.name, 'Type:', templateConfig.type);
          
          // Record template usage for analytics
          await recordTemplateUsage(templateConfig.id);
          
          // Generate PDF using database template configuration
          return await generateDatabaseTemplatedPDF(invoice, profileData, templateConfig);
        } else if (templateConfig && templateConfig.isStatic) {
          console.log('🔄 Database template is static type, using static generator:', templateConfig.type);
          return await generateTemplatedPDF(invoice, profileData, templateConfig.type);
        } else {
          console.warn('⚠️ Database template not found, falling back to static templates');
        }
      } catch (dbError) {
        console.error('❌ Database template error:', dbError);
      }
    }
    
    // Fallback to static template system from templates.js
    // Map potential UUIDs to template types for static templates
    let staticTemplateId = templateId;
    
    // If templateId looks like a UUID, we need to determine the template type
    if (templateId && templateId.length > 10 && templateId.includes('-')) {
      console.log('🔄 UUID detected, trying to map to static template type');
      
      // Try to get the template from database to find its type
      try {
        const dbTemplate = await getTemplateForPDF(templateId);
        if (dbTemplate && dbTemplate.type) {
          staticTemplateId = dbTemplate.type; // Use the template type instead of UUID
          console.log('🎯 Mapped UUID to template type:', staticTemplateId);
        }
      } catch (err) {
        console.warn('Failed to map UUID to template type, using professional as fallback');
        staticTemplateId = 'professional';
      }
    }
    
    console.log('🔄 Using static template system with staticTemplateId:', staticTemplateId || 'professional');
    return await generateTemplatedPDF(invoice, profileData, staticTemplateId || 'professional');
    
  } catch (error) {
    console.error('💥 Error in generateInvoicePDF:', error);
    
    // Final fallback - use simple professional template
    console.log('🆘 Using emergency fallback template');
    return await generateTemplatedPDF(invoice, profileData, 'professional');
  }
};

/**
 * Generate PDF invoice using database template configuration
 */
export const generateDatabaseTemplatedPDF = async (invoice, profileData = {}, templateConfig) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Get currency configuration
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
  
  const primaryRgb = hexToRgb(templateConfig.colors.primary);
  const secondaryRgb = hexToRgb(templateConfig.colors.secondary);
  const textRgb = hexToRgb(templateConfig.colors.text);
  const accentRgb = hexToRgb(templateConfig.colors.accent);
  
  // Company/Business Information
  const businessName = profileData.business_name || templateConfig.branding.businessName || 'Your Business';
  const businessAddress = profileData.address || '';
  const businessPhone = profileData.phone || '';
  const businessWebsite = profileData.website || '';
  const businessEmail = profileData.email || '';
  
  // Load logo if available
  let logoImage = null;
  if (templateConfig.branding.logoUrl && templateConfig.branding.showLogo) {
    try {
      logoImage = await loadImageFromUrl(templateConfig.branding.logoUrl);
    } catch (error) {
      console.warn('Failed to load logo image:', error);
    }
  }
  
  // Header with template colors
  pdf.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  pdf.rect(0, 0, pageWidth, templateConfig.layout.headerHeight, 'F');
  
  // Logo placement (if available)
  if (logoImage && templateConfig.branding.showLogo) {
    try {
      const logoSize = 24; // Fixed logo height
      const logoX = templateConfig.layout.marginX;
      const logoY = 8;
      
      // Calculate width maintaining aspect ratio
      const logoWidth = (logoImage.width / logoImage.height) * logoSize;
      
      pdf.addImage(logoImage.data, 'PNG', logoX, logoY, logoWidth, logoSize);
      
      // Adjust text position to account for logo
      const textStartX = logoX + logoWidth + 10;
      
      // Company/brand name next to logo
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(templateConfig.fonts.heading.size);
      pdf.setFont('helvetica', templateConfig.fonts.heading.weight);
      pdf.text('PayRush', textStartX, 25);
      
      // Business name
      pdf.setFontSize(templateConfig.fonts.body.size);
      pdf.setFont('helvetica', templateConfig.fonts.body.weight);
      pdf.text(businessName, textStartX, 35);
    } catch (error) {
      console.warn('Error adding logo to PDF:', error);
      // Fallback to text-only header
      addTextOnlyHeader();
    }
  } else {
    // Text-only header
    addTextOnlyHeader();
  }
  
  function addTextOnlyHeader() {
    // Company/brand name in header
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(templateConfig.fonts.heading.size);
    pdf.setFont('helvetica', templateConfig.fonts.heading.weight);
    pdf.text('PayRush', templateConfig.layout.marginX, 25);
    
    // Business name
    pdf.setFontSize(templateConfig.fonts.body.size);
    pdf.setFont('helvetica', templateConfig.fonts.body.weight);
    pdf.text(businessName, templateConfig.layout.marginX, 35);
  }
  
  // Invoice title with template colors
  pdf.setTextColor(255, 255, 255);  // White text on blue background
  pdf.setFontSize(templateConfig.fonts.heading.size + 8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE', pageWidth - templateConfig.layout.marginX, 20, { align: 'right' });
  
  // Invoice Details Box (positioned on blue background with proper spacing)
  pdf.setTextColor(255, 255, 255);  // White text for visibility
  pdf.setFontSize(templateConfig.fonts.body.size - 2);  // Smaller text for better fit
  pdf.setFont('helvetica', templateConfig.fonts.body.weight);
  
  const invoiceDetailsX = pageWidth - 80;  // Moved further left to prevent cutoff
  const invoiceDetailsY = 22;  // Moved higher to ensure all text fits within header
  
  pdf.text(`Invoice ID: #${invoice.id?.slice(0, 8) || 'N/A'}`, invoiceDetailsX, invoiceDetailsY);
  pdf.text(`Date: ${new Date(invoice.created_at || new Date()).toLocaleDateString()}`, invoiceDetailsX, invoiceDetailsY + 3.5);
  pdf.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, invoiceDetailsX, invoiceDetailsY + 7);
  pdf.text(`Status: ${(invoice.status || 'draft').toUpperCase()}`, invoiceDetailsX, invoiceDetailsY + 10.5);
  
  // Business Details Section (start well below the blue header)
  let currentY = templateConfig.layout.headerHeight + 15;  // Increased margin from header
  
  pdf.setTextColor(textRgb.r, textRgb.g, textRgb.b);
  pdf.setFontSize(templateConfig.fonts.subheading.size);
  pdf.setFont('helvetica', templateConfig.fonts.subheading.weight);
  pdf.text('From:', templateConfig.layout.marginX, currentY);
  
  currentY += 8;
  pdf.setFontSize(templateConfig.fonts.body.size);
  pdf.setFont('helvetica', templateConfig.fonts.body.weight);
  pdf.text(businessName, templateConfig.layout.marginX, currentY);
  
  if (businessAddress) {
    currentY += 5;
    pdf.text(businessAddress, templateConfig.layout.marginX, currentY);
  }
  
  if (businessPhone) {
    currentY += 5;
    pdf.text(`Phone: ${businessPhone}`, templateConfig.layout.marginX, currentY);
  }
  
  if (businessEmail) {
    currentY += 5;
    pdf.text(`Email: ${businessEmail}`, templateConfig.layout.marginX, currentY);
  }
  
  if (businessWebsite) {
    currentY += 5;
    pdf.text(`Website: ${businessWebsite}`, templateConfig.layout.marginX, currentY);
  }
  
  // Customer Details Section (also start below header)
  const customerY = templateConfig.layout.headerHeight + 15;  // Increased margin from header
  
  pdf.setFontSize(templateConfig.fonts.subheading.size);
  pdf.setFont('helvetica', templateConfig.fonts.subheading.weight);
  pdf.text('Bill To:', pageWidth - 70, customerY);
  
  pdf.setFontSize(templateConfig.fonts.body.size);
  pdf.setFont('helvetica', templateConfig.fonts.body.weight);
  pdf.text(invoice.customer_name || 'Customer Name', pageWidth - 70, customerY + 8);
  
  if (invoice.customer_email) {
    pdf.text(invoice.customer_email, pageWidth - 70, customerY + 13);
  }
  
  // Invoice Items Table (ensure adequate spacing)
  currentY = Math.max(currentY, customerY + 35, 125);  // Increased minimum Y position
  const tableStartY = currentY;
  
  // Table Header with template accent color
  pdf.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
  pdf.rect(templateConfig.layout.marginX, tableStartY, pageWidth - (templateConfig.layout.marginX * 2), 10, 'F');
  
  pdf.setTextColor(textRgb.r, textRgb.g, textRgb.b);
  pdf.setFontSize(templateConfig.fonts.body.size);
  pdf.setFont('helvetica', templateConfig.fonts.body.weight);
  
  pdf.text('Description', templateConfig.layout.marginX + 5, tableStartY + 7);
  pdf.text('Quantity', pageWidth - 90, tableStartY + 7, { align: 'center' });
  pdf.text('Rate', pageWidth - 60, tableStartY + 7, { align: 'center' });
  pdf.text('Amount', pageWidth - templateConfig.layout.marginX - 5, tableStartY + 7, { align: 'right' });
  
  // Table Border
  pdf.setDrawColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
  pdf.setLineWidth(0.1);
  pdf.rect(templateConfig.layout.marginX, tableStartY, pageWidth - (templateConfig.layout.marginX * 2), 10);
  
  // Invoice Items (handle line items if available)
  currentY = tableStartY + 15;
  
  if (invoice.line_items && invoice.line_items.length > 0) {
    // Sort line items by sort_order if available
    const sortedItems = invoice.line_items.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    
    sortedItems.forEach((item, index) => {
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(textRgb.r, textRgb.g, textRgb.b);
      
      // Description (wrap long text if needed)
      const description = item.description || 'Item';
      pdf.text(description, templateConfig.layout.marginX + 5, currentY);
      
      // Quantity
      pdf.text((item.quantity || 1).toString(), pageWidth - 90, currentY, { align: 'center' });
      
      // Unit Price
      pdf.text(formatCurrency(item.unit_price || 0, invoice.currency), pageWidth - 60, currentY, { align: 'center' });
      
      // Line Total
      const lineTotal = item.total || (item.quantity * item.unit_price) || 0;
      pdf.text(formatCurrency(lineTotal, invoice.currency), pageWidth - templateConfig.layout.marginX - 5, currentY, { align: 'right' });
      
      // Row border
      pdf.setDrawColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
      pdf.setLineWidth(0.1);
      pdf.rect(templateConfig.layout.marginX, currentY - 5, pageWidth - (templateConfig.layout.marginX * 2), 10);
      currentY += 10;
    });
  } else {
    // Single invoice amount (fallback for invoices without line items)
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(textRgb.r, textRgb.g, textRgb.b);
    
    const description = invoice.description || 'Invoice Payment';
    pdf.text(description, templateConfig.layout.marginX + 5, currentY);
    pdf.text('1', pageWidth - 90, currentY, { align: 'center' });
    pdf.text(formatCurrency(invoice.amount, invoice.currency), pageWidth - 60, currentY, { align: 'center' });
    pdf.text(formatCurrency(invoice.amount, invoice.currency), pageWidth - templateConfig.layout.marginX - 5, currentY, { align: 'right' });
    
    // Row border
    pdf.setDrawColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
    pdf.setLineWidth(0.1);
    pdf.rect(templateConfig.layout.marginX, currentY - 5, pageWidth - (templateConfig.layout.marginX * 2), 10);
    currentY += 10;
  }
  
  // Totals Section
  currentY += 15;
  const totalsX = pageWidth - 90;  // Moved left to provide more space
  
  // Calculate totals
  const subtotal = invoice.line_items 
    ? invoice.line_items.reduce((sum, item) => sum + (item.total || (item.quantity * item.unit_price)), 0)
    : invoice.amount;
  
  // Subtotal
  pdf.setFont('helvetica', 'normal');
  pdf.text('Subtotal:', totalsX, currentY);
  pdf.text(formatCurrency(subtotal, invoice.currency), pageWidth - templateConfig.layout.marginX - 5, currentY, { align: 'right' });
  
  currentY += 8;
  
  // Total (highlight with template primary color)
  pdf.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  pdf.rect(totalsX - 5, currentY - 5, 85, 12, 'F');  // Made box slightly wider
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(templateConfig.fonts.subheading.size);
  pdf.text('Total:', totalsX, currentY + 2);
  pdf.text(formatCurrency(invoice.amount, invoice.currency), pageWidth - templateConfig.layout.marginX - 5, currentY + 2, { align: 'right' });
  
  // Currency Information
  currentY += 20;
  pdf.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
  pdf.setFontSize(templateConfig.fonts.small.size);
  pdf.setFont('helvetica', templateConfig.fonts.small.weight);
  pdf.text(`Currency: ${currency.name} (${currency.code})`, templateConfig.layout.marginX, currentY);
  
  // Footer with template accent
  const footerY = pageHeight - 30;
  
  pdf.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
  pdf.rect(0, footerY - 10, pageWidth, 40, 'F');
  
  pdf.setTextColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
  pdf.setFontSize(templateConfig.fonts.small.size);
  pdf.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });
  
  pdf.setFontSize(templateConfig.fonts.small.size - 1);
  pdf.text('Generated by PayRush - Professional Invoice Management', pageWidth / 2, footerY + 5, { align: 'center' });
  pdf.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pageWidth / 2, footerY + 10, { align: 'center' });
  
  return pdf;
};

/**
 * Helper function to load images from URLs for PDF generation
 */
const loadImageFromUrl = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Handle CORS
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      
      try {
        const dataUrl = canvas.toDataURL('image/png');
        resolve({
          data: dataUrl,
          width: img.width,
          height: img.height
        });
      } catch (error) {
        reject(new Error('Failed to convert image to data URL'));
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image from URL'));
    };
    
    // Add timestamp to avoid caching issues
    const urlWithTimestamp = url.includes('?') 
      ? `${url}&t=${Date.now()}` 
      : `${url}?t=${Date.now()}`;
      
    img.src = urlWithTimestamp;
  });
};

/**
 * Download invoice as PDF
 */
export const downloadInvoicePDF = async (invoice, profileData = {}, templateId = null) => {
  try {
    console.log('📄 downloadInvoicePDF called with templateId:', templateId);
    console.log('📄 Invoice data:', { id: invoice.id, customer_name: invoice.customer_name, template_id: invoice.template_id });
    
    // Template priority: 1. Passed templateId, 2. Invoice's saved template_id, 3. Customer name testing
    let finalTemplateId = templateId;
    
    if (!finalTemplateId && invoice.template_id) {
      finalTemplateId = invoice.template_id;
      console.log('📋 Using invoice.template_id from database:', finalTemplateId);
    }
    
    // FOR TESTING: Only use customer name forcing if no template_id was saved to the invoice
    if (!finalTemplateId) {
      console.log('⚠️  No template_id found in invoice data - using fallback logic');
      const customerName = invoice.customer_name || '';
      console.log('🎲 No valid template ID saved, using customer name for testing:', customerName);
      
      if (customerName.toLowerCase().includes('classic')) {
        finalTemplateId = 'classic';
        console.log('🏛️ FORCING CLASSIC template for customer:', customerName);
      } else if (customerName.toLowerCase().includes('modern')) {
        finalTemplateId = 'modern';
        console.log('🟣 FORCING MODERN template for customer:', customerName);
      } else if (customerName.toLowerCase().includes('minimal')) {
        finalTemplateId = 'minimal';
        console.log('⚪ FORCING MINIMAL template for customer:', customerName);
      } else if (customerName.toLowerCase().includes('acme')) {
        finalTemplateId = 'minimal';
        console.log('⚪ FORCING MINIMAL template for ACME customer:', customerName);
      } else if (customerName.toLowerCase().includes('tech')) {
        finalTemplateId = 'modern';
        console.log('🟣 FORCING MODERN template for TECH customer:', customerName);
      } else if (customerName.toLowerCase().includes('corp')) {
        finalTemplateId = 'classic';
        console.log('🏛️ FORCING CLASSIC template for CORP customer:', customerName);
      } else {
        finalTemplateId = 'professional';
        console.log('💼 USING PROFESSIONAL template (default) for customer:', customerName);
      }
      console.log('🎲 Fallback template selected:', finalTemplateId);
    } else {
      console.log('✅ Template ID found:', finalTemplateId);
    }
    
    console.log('🎯 Final template ID to use:', finalTemplateId);
    
    const pdf = await generateInvoicePDF(invoice, profileData, finalTemplateId);
    const filename = `invoice-${invoice.id?.slice(0, 8) || 'draft'}-${finalTemplateId}-${Date.now()}.pdf`;
    pdf.save(filename);
    console.log('✅ PDF saved with filename:', filename);
    return { success: true, filename };
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Preview invoice PDF in new tab
 */
export const previewInvoicePDF = async (invoice, profileData = {}, templateId = null) => {
  try {
    const pdf = await generateInvoicePDF(invoice, profileData, templateId);
    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
    return { success: true };
  } catch (error) {
    console.error('Error previewing PDF:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate PDF buffer for email attachment
 */
export const generateInvoicePDFBuffer = async (invoice, profileData = {}, templateId = null) => {
  try {
    console.log('📧 Starting PDF buffer generation for email attachment:', {
      invoiceId: invoice?.id,
      hasInvoice: !!invoice,
      hasProfileData: !!profileData,
      templateId
    });
    
    // Use existing PDF generation logic
    console.log('🔄 Calling generateInvoicePDF...');
    const pdf = await generateInvoicePDF(invoice, profileData, templateId);
    console.log('📄 generateInvoicePDF result:', { hasPdf: !!pdf, pdfType: typeof pdf });
    
    if (!pdf) {
      throw new Error('PDF generation returned null/undefined');
    }
    
    // Convert PDF to base64 buffer for server transmission
    console.log('🔄 Converting PDF to base64 buffer...');
    const pdfBuffer = pdf.output('datauristring');
    const base64Data = pdfBuffer.split(',')[1]; // Remove data:application/pdf;base64, prefix
    
    console.log('📊 PDF buffer conversion result:', {
      originalLength: pdfBuffer?.length,
      base64Length: base64Data?.length,
      hasBase64: !!base64Data
    });
    
    // Generate filename using same logic as downloadInvoicePDF
    const invoiceNumber = invoice.custom_invoice_number || 
                         invoice.invoice_number || 
                         `INV-${invoice.id.split('-')[0].toUpperCase()}`;
    
    const finalTemplateId = templateId || invoice.template_id || 'professional';
    const filename = `invoice-${invoiceNumber}.pdf`;
    
    console.log('✅ PDF buffer generated successfully for email:', {
      filename,
      invoiceNumber,
      finalTemplateId,
      bufferSize: base64Data?.length
    });
    
    return {
      success: true,
      buffer: base64Data,
      filename: filename,
      size: base64Data.length
    };
    
  } catch (error) {
    console.error('❌ Error generating PDF buffer for email:', error);
    return {
      success: false,
      error: error.message,
      buffer: null,
      filename: null
    };
  }
};

/**
 * Generate PDF from HTML element (alternative method)
 */
export const generatePDFFromHTML = async (elementId, filename = 'invoice.pdf') => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id '${elementId}' not found`);
    }
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    pdf.save(filename);
    return { success: true, filename };
  } catch (error) {
    console.error('Error generating PDF from HTML:', error);
    return { success: false, error: error.message };
  }
};

export default {
  generateInvoicePDF,
  generateDatabaseTemplatedPDF,
  downloadInvoicePDF,
  previewInvoicePDF,
  generateInvoicePDFBuffer,
  generatePDFFromHTML,
  INVOICE_TEMPLATES
};