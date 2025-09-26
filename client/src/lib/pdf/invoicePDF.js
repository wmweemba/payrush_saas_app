/**
 * PDF Invoice Generation for PayRush
 * Generates professional invoices with multi-currency support
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatCurrency, getCurrency } from '@/lib/currency/currencies';
import { generateTemplatedPDF, INVOICE_TEMPLATES } from './templates';

/**
 * Generate PDF invoice from invoice data with template support
 */
export const generateInvoicePDF = async (invoice, profileData = {}, templateId = 'professional') => {
  // Use the new template system if templateId is provided
  if (templateId && templateId !== 'default') {
    return generateTemplatedPDF(invoice, profileData, templateId);
  }
  
  // Default/original template (keeping for backward compatibility)
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Get currency configuration
  const currency = getCurrency(invoice.currency || 'USD');
  
  // Colors
  const primaryColor = '#2563eb'; // Blue
  const secondaryColor = '#64748b'; // Gray
  const textColor = '#1f2937'; // Dark gray
  
  // Company/Business Information
  const businessName = profileData.business_name || 'Your Business';
  const businessAddress = profileData.address || '';
  const businessPhone = profileData.phone || '';
  const businessWebsite = profileData.website || '';
  const businessEmail = profileData.email || '';
  
  // Header - Business Info
  pdf.setFillColor(37, 99, 235); // Primary blue
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PayRush', 20, 25);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(businessName, 20, 35);
  
  // Invoice Title
  pdf.setTextColor(37, 99, 235);
  pdf.setFontSize(32);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE', pageWidth - 20, 25, { align: 'right' });
  
  // Invoice Details Box
  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  const invoiceDetailsX = pageWidth - 70;
  const invoiceDetailsY = 35;
  
  pdf.text(`Invoice ID: #${invoice.id?.slice(0, 8) || 'N/A'}`, invoiceDetailsX, invoiceDetailsY);
  pdf.text(`Date: ${new Date(invoice.created_at || new Date()).toLocaleDateString()}`, invoiceDetailsX, invoiceDetailsY + 5);
  pdf.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, invoiceDetailsX, invoiceDetailsY + 10);
  pdf.text(`Status: ${(invoice.status || 'draft').toUpperCase()}`, invoiceDetailsX, invoiceDetailsY + 15);
  
  // Business Details Section
  let currentY = 60;
  
  pdf.setTextColor(31, 41, 55);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('From:', 20, currentY);
  
  currentY += 8;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(businessName, 20, currentY);
  
  if (businessAddress) {
    currentY += 5;
    pdf.text(businessAddress, 20, currentY);
  }
  
  if (businessPhone) {
    currentY += 5;
    pdf.text(`Phone: ${businessPhone}`, 20, currentY);
  }
  
  if (businessEmail) {
    currentY += 5;
    pdf.text(`Email: ${businessEmail}`, 20, currentY);
  }
  
  if (businessWebsite) {
    currentY += 5;
    pdf.text(`Website: ${businessWebsite}`, 20, currentY);
  }
  
  // Customer Details Section
  currentY = 60;
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Bill To:', pageWidth - 70, currentY);
  
  currentY += 8;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(invoice.customer_name || 'Customer Name', pageWidth - 70, currentY);
  
  if (invoice.customer_email) {
    currentY += 5;
    pdf.text(invoice.customer_email, pageWidth - 70, currentY);
  }
  
  // Invoice Items Table
  currentY = Math.max(currentY, 120);
  const tableStartY = currentY;
  
  // Table Header
  pdf.setFillColor(248, 250, 252); // Light gray background
  pdf.rect(20, tableStartY, pageWidth - 40, 10, 'F');
  
  pdf.setTextColor(31, 41, 55);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  
  pdf.text('Description', 25, tableStartY + 7);
  pdf.text('Quantity', pageWidth - 80, tableStartY + 7, { align: 'center' });
  pdf.text('Rate', pageWidth - 50, tableStartY + 7, { align: 'center' });
  pdf.text('Amount', pageWidth - 25, tableStartY + 7, { align: 'right' });
  
  // Table Border
  pdf.setDrawColor(229, 231, 235);
  pdf.setLineWidth(0.1);
  pdf.rect(20, tableStartY, pageWidth - 40, 10);
  
  // Invoice Item (for now, single item)
  currentY = tableStartY + 15;
  
  pdf.setFont('helvetica', 'normal');
  pdf.text('Invoice Payment', 25, currentY);
  pdf.text('1', pageWidth - 80, currentY, { align: 'center' });
  pdf.text(formatCurrency(invoice.amount, invoice.currency), pageWidth - 50, currentY, { align: 'center' });
  pdf.text(formatCurrency(invoice.amount, invoice.currency), pageWidth - 25, currentY, { align: 'right' });
  
  // Table row border
  pdf.rect(20, currentY - 5, pageWidth - 40, 10);
  
  // Totals Section
  currentY += 20;
  const totalsX = pageWidth - 80;
  
  // Subtotal
  pdf.setFont('helvetica', 'normal');
  pdf.text('Subtotal:', totalsX, currentY);
  pdf.text(formatCurrency(invoice.amount, invoice.currency), pageWidth - 25, currentY, { align: 'right' });
  
  currentY += 8;
  
  // Total (highlight)
  pdf.setFillColor(37, 99, 235);
  pdf.rect(totalsX - 5, currentY - 5, 75, 12, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('Total:', totalsX, currentY + 2);
  pdf.text(formatCurrency(invoice.amount, invoice.currency), pageWidth - 25, currentY + 2, { align: 'right' });
  
  // Currency Information
  currentY += 20;
  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Currency: ${currency.name} (${currency.code}) ${currency.flag}`, 20, currentY);
  
  // Footer
  const footerY = pageHeight - 30;
  
  pdf.setFillColor(248, 250, 252);
  pdf.rect(0, footerY - 10, pageWidth, 40, 'F');
  
  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(9);
  pdf.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });
  
  pdf.setFontSize(8);
  pdf.text('Generated by PayRush - Professional Invoice Management', pageWidth / 2, footerY + 5, { align: 'center' });
  pdf.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pageWidth / 2, footerY + 10, { align: 'center' });
  
  return pdf;
};

/**
 * Download invoice as PDF
 */
export const downloadInvoicePDF = async (invoice, profileData = {}, templateId = 'professional') => {
  try {
    const pdf = await generateInvoicePDF(invoice, profileData, templateId);
    const filename = `invoice-${invoice.id?.slice(0, 8) || 'draft'}-${Date.now()}.pdf`;
    pdf.save(filename);
    return { success: true, filename };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Preview invoice PDF in new tab
 */
export const previewInvoicePDF = async (invoice, profileData = {}, templateId = 'professional') => {
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
  downloadInvoicePDF,
  previewInvoicePDF,
  generatePDFFromHTML,
  INVOICE_TEMPLATES
};