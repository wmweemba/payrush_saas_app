/**
 * Server-Side PDF Generation Service
 * 
 * Industry standard approach: Generate PDFs on server, not client
 * Benefits: Reliable, efficient, cacheable, consistent rendering
 */

const { supabase } = require('../config/database');
const { formatCurrency } = require('../utils');

class ServerPDFService {
  
  /**
   * Generate invoice PDF HTML (ready for PDF conversion)
   * This approach is more reliable than client-side PDF generation
   */
  static async generateInvoicePDFHTML(invoiceId, userId) {
    try {
      console.log(`📄 Generating server-side PDF HTML for invoice ${invoiceId}`);
      
      // Fetch complete invoice data with line items and branding
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_items (
            id,
            description,
            quantity,
            unit_price,
            line_total,
            sort_order
          )
        `)
        .eq('id', invoiceId)
        .eq('user_id', userId)
        .single();

      if (invoiceError || !invoice) {
        throw new Error('Invoice not found');
      }

      // Get branding information
      const { data: branding } = await supabase
        .from('business_branding')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Generate invoice number
      const invoiceNumber = invoice.custom_invoice_number || 
                           invoice.invoice_number || 
                           `INV-${invoice.id.split('-')[0].toUpperCase()}`;

      // Calculate totals
      const lineItems = invoice.invoice_items || [];
      const subtotal = lineItems.reduce((sum, item) => sum + (item.line_total || 0), 0);
      const total = invoice.amount || subtotal;

      // Format dates
      const invoiceDate = new Date(invoice.invoice_date || invoice.created_at).toLocaleDateString();
      const dueDate = new Date(invoice.due_date).toLocaleDateString();

      // Generate professional invoice HTML
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Helvetica', 'Arial', sans-serif; 
      font-size: 12px; 
      line-height: 1.4; 
      color: #333;
      background: white;
    }
    .invoice-container { 
      max-width: 800px; 
      margin: 0 auto; 
      padding: 40px;
      background: white;
    }
    .header { 
      display: flex; 
      justify-content: space-between; 
      margin-bottom: 40px; 
      border-bottom: 3px solid #667eea;
      padding-bottom: 20px;
    }
    .company-info { flex: 1; }
    .company-name { 
      font-size: 24px; 
      font-weight: bold; 
      color: #667eea; 
      margin-bottom: 10px; 
    }
    .company-details { color: #666; line-height: 1.6; }
    .invoice-title { 
      text-align: right; 
      flex: 1; 
    }
    .invoice-number { 
      font-size: 36px; 
      font-weight: bold; 
      color: #333; 
      margin-bottom: 10px; 
    }
    .invoice-dates { color: #666; }
    .billing-section { 
      display: flex; 
      justify-content: space-between; 
      margin: 40px 0; 
    }
    .bill-to, .invoice-details { flex: 1; }
    .section-title { 
      font-size: 14px; 
      font-weight: bold; 
      color: #667eea; 
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .client-info { line-height: 1.6; }
    .items-table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 30px 0; 
    }
    .items-table th { 
      background: #f8f9fa; 
      padding: 15px 10px; 
      border: 1px solid #dee2e6; 
      font-weight: bold;
      text-align: left;
    }
    .items-table td { 
      padding: 12px 10px; 
      border: 1px solid #dee2e6; 
    }
    .items-table .qty, .items-table .rate, .items-table .amount { 
      text-align: right; 
    }
    .totals-section { 
      margin-top: 30px; 
      text-align: right; 
    }
    .totals-table { 
      margin-left: auto; 
      border-collapse: collapse;
      min-width: 300px;
    }
    .totals-table td { 
      padding: 8px 15px; 
      border-bottom: 1px solid #eee; 
    }
    .totals-table .label { 
      text-align: right; 
      font-weight: bold; 
    }
    .totals-table .total-row { 
      font-size: 16px; 
      font-weight: bold; 
      border-top: 2px solid #667eea;
      background: #f8f9fa;
    }
    .payment-info { 
      margin-top: 40px; 
      padding: 20px; 
      background: #f8f9fa; 
      border-left: 4px solid #667eea;
    }
    .footer { 
      margin-top: 40px; 
      text-align: center; 
      color: #666; 
      font-size: 11px;
      border-top: 1px solid #eee;
      padding-top: 20px;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; }
      .invoice-container { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <div class="company-info">
        <div class="company-name">${branding?.company_name || 'Your Business'}</div>
        <div class="company-details">
          ${branding?.address ? branding.address + '<br>' : ''}
          ${branding?.phone ? 'Phone: ' + branding.phone + '<br>' : ''}
          ${branding?.email ? 'Email: ' + branding.email : ''}
        </div>
      </div>
      <div class="invoice-title">
        <div class="invoice-number">INVOICE</div>
        <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">#${invoiceNumber}</div>
        <div class="invoice-dates">
          <div>Date: ${invoiceDate}</div>
          <div>Due: ${dueDate}</div>
        </div>
      </div>
    </div>

    <!-- Billing Information -->
    <div class="billing-section">
      <div class="bill-to">
        <div class="section-title">Bill To</div>
        <div class="client-info">
          <strong>${invoice.customer_name || 'Client'}</strong><br>
          ${invoice.customer_email ? invoice.customer_email + '<br>' : ''}
        </div>
      </div>
      <div class="invoice-details">
        <div class="section-title">Invoice Details</div>
        <div>
          <strong>Status:</strong> ${invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}<br>
          <strong>Currency:</strong> ${invoice.currency || 'USD'}<br>
          ${invoice.payment_terms ? '<strong>Payment Terms:</strong> ' + invoice.payment_terms + ' days<br>' : ''}
        </div>
      </div>
    </div>

    <!-- Line Items -->
    ${lineItems.length > 0 ? `
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 50%;">Description</th>
          <th class="qty" style="width: 15%;">Qty</th>
          <th class="rate" style="width: 20%;">Rate</th>
          <th class="amount" style="width: 15%;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${lineItems.map(item => `
          <tr>
            <td>${item.description || 'Service'}</td>
            <td class="qty">${item.quantity || 1}</td>
            <td class="rate">${formatCurrency(item.unit_price || 0, invoice.currency)}</td>
            <td class="amount">${formatCurrency(item.line_total || 0, invoice.currency)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ` : `
    <div style="padding: 20px; background: #f8f9fa; text-align: center; margin: 30px 0;">
      <strong>Service Description:</strong> ${invoice.description || 'Professional Services'}
    </div>
    `}

    <!-- Totals -->
    <div class="totals-section">
      <table class="totals-table">
        ${lineItems.length > 1 ? `
        <tr>
          <td class="label">Subtotal:</td>
          <td>${formatCurrency(subtotal, invoice.currency)}</td>
        </tr>
        ` : ''}
        <tr class="total-row">
          <td class="label">Total:</td>
          <td><strong>${formatCurrency(total, invoice.currency)}</strong></td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Payment Information -->
  <div class="payment-info">
    <div class="section-title">Payment Information</div>
    ${this.generatePaymentInstructions(branding)}
  </div>

  <!-- Footer -->
  <div class="footer">
    <p>Thank you for your business!</p>
    <p>This invoice was generated on ${new Date().toLocaleDateString()}</p>
  </div>
</div>
</body>
</html>`;

      console.log(`✅ Generated PDF HTML for invoice ${invoiceNumber}`);
      
      return {
        success: true,
        html: htmlContent,
        invoiceNumber: invoiceNumber,
        filename: `invoice-${invoiceNumber}.pdf`
      };

    } catch (error) {
      console.error('❌ Error generating PDF HTML:', error);
      return {
        success: false,
        error: error.message,
        html: null
      };
    }
  }

  /**
   * Generate payment instructions HTML
   */
  static generatePaymentInstructions(branding) {
    if (!branding) {
      return `
        <p><strong>Payment Methods:</strong></p>
        <ul>
          <li>Bank transfer (contact us for details)</li>
          <li>Check payment</li>
          <li>Online payment (link will be provided)</li>
        </ul>
      `;
    }

    let instructions = '<p><strong>Payment Methods:</strong></p><ul>';
    
    if (branding.bank_name || branding.account_number) {
      instructions += '<li><strong>Bank Transfer:</strong><br>';
      if (branding.bank_name) instructions += `Bank: ${branding.bank_name}<br>`;
      if (branding.account_holder_name) instructions += `Account Holder: ${branding.account_holder_name}<br>`;
      if (branding.account_number) instructions += `Account: ${branding.account_number}<br>`;
      if (branding.routing_number) instructions += `Routing: ${branding.routing_number}`;
      instructions += '</li>';
    }
    
    instructions += '<li>Check payment</li>';
    instructions += '<li>Contact us for other payment options</li>';
    instructions += '</ul>';

    if (branding.payment_instructions) {
      instructions += `<p><strong>Additional Instructions:</strong><br>${branding.payment_instructions.replace(/\n/g, '<br>')}</p>`;
    }

    return instructions;
  }
}

module.exports = ServerPDFService;