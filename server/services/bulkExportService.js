/**
 * Bulk Export Service
 * Handles various export formats for invoice data
 */

const XLSX = require('xlsx');

class BulkExportService {
  
  /**
   * Convert invoice data to CSV format
   */
  static convertToCSV(data, options = {}) {
    if (!data || data.length === 0) {
      return 'No data available for export';
    }

    const { includeLineItems, includePayments } = options;
    
    // Base invoice headers
    const headers = [
      'Invoice ID',
      'Customer Name',
      'Customer Email',
      'Amount',
      'Currency',
      'Status',
      'Due Date',
      'Created Date',
      'Updated Date'
    ];

    // Add line items headers if included
    if (includeLineItems) {
      headers.push('Line Items Count', 'Line Items Details');
    }

    // Add payments headers if included
    if (includePayments) {
      headers.push('Payments Count', 'Total Paid', 'Payment Details');
    }

    // Convert data to CSV rows
    const rows = data.map(invoice => {
      const row = [
        invoice.id || '',
        invoice.customer_name || '',
        invoice.customer_email || '',
        invoice.amount || '0',
        invoice.currency || 'USD',
        invoice.status || '',
        this.formatDate(invoice.due_date),
        this.formatDate(invoice.created_at),
        this.formatDate(invoice.updated_at)
      ];

      // Add line items data if included
      if (includeLineItems) {
        const lineItems = invoice.line_items || [];
        row.push(lineItems.length);
        row.push(lineItems.map(item => 
          `${item.description || 'No description'} (Qty: ${item.quantity || 0}, Unit: ${item.unit_price || 0})`
        ).join('; '));
      }

      // Add payments data if included
      if (includePayments) {
        const payments = invoice.payments || [];
        const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
        row.push(payments.length);
        row.push(totalPaid);
        row.push(payments.map(payment => 
          `${payment.amount || 0} ${payment.currency || 'USD'} on ${this.formatDate(payment.created_at)}`
        ).join('; '));
      }

      return row;
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Convert invoice data to Excel format
   */
  static convertToExcel(data, options = {}) {
    if (!data || data.length === 0) {
      // Create empty workbook with message
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([['No data available for export']]);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');
      return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    }

    const { includeLineItems, includePayments } = options;
    const workbook = XLSX.utils.book_new();

    // Main invoices sheet
    const invoiceData = this.prepareInvoiceDataForExcel(data, { includeLineItems, includePayments });
    const invoiceWorksheet = XLSX.utils.aoa_to_sheet(invoiceData);
    
    // Set column widths for better readability
    const columnWidths = [
      { wch: 15 }, // Invoice ID
      { wch: 20 }, // Customer Name
      { wch: 25 }, // Customer Email
      { wch: 12 }, // Amount
      { wch: 8 },  // Currency
      { wch: 10 }, // Status
      { wch: 12 }, // Due Date
      { wch: 12 }, // Created Date
      { wch: 12 }  // Updated Date
    ];

    if (includeLineItems) {
      columnWidths.push({ wch: 15 }, { wch: 50 }); // Line items columns
    }

    if (includePayments) {
      columnWidths.push({ wch: 15 }, { wch: 12 }, { wch: 50 }); // Payment columns
    }

    invoiceWorksheet['!cols'] = columnWidths;
    XLSX.utils.book_append_sheet(workbook, invoiceWorksheet, 'Invoices');

    // Separate line items sheet if requested
    if (includeLineItems) {
      const lineItemsData = this.prepareLineItemsDataForExcel(data);
      if (lineItemsData.length > 1) { // More than just headers
        const lineItemsWorksheet = XLSX.utils.aoa_to_sheet(lineItemsData);
        lineItemsWorksheet['!cols'] = [
          { wch: 15 }, // Invoice ID
          { wch: 30 }, // Description
          { wch: 10 }, // Quantity
          { wch: 12 }, // Unit Price
          { wch: 12 }, // Total
          { wch: 8 }   // Currency
        ];
        XLSX.utils.book_append_sheet(workbook, lineItemsWorksheet, 'Line Items');
      }
    }

    // Separate payments sheet if requested
    if (includePayments) {
      const paymentsData = this.preparePaymentsDataForExcel(data);
      if (paymentsData.length > 1) { // More than just headers
        const paymentsWorksheet = XLSX.utils.aoa_to_sheet(paymentsData);
        paymentsWorksheet['!cols'] = [
          { wch: 15 }, // Invoice ID
          { wch: 12 }, // Amount
          { wch: 8 },  // Currency
          { wch: 15 }, // Payment Method
          { wch: 20 }, // Reference
          { wch: 12 }, // Date
          { wch: 10 }  // Status
        ];
        XLSX.utils.book_append_sheet(workbook, paymentsWorksheet, 'Payments');
      }
    }

    // Summary sheet
    const summaryData = this.prepareSummaryDataForExcel(data);
    const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWorksheet['!cols'] = [{ wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Prepare invoice data for Excel format
   */
  static prepareInvoiceDataForExcel(data, options = {}) {
    const { includeLineItems, includePayments } = options;
    
    // Headers
    const headers = [
      'Invoice ID',
      'Customer Name',
      'Customer Email',
      'Amount',
      'Currency',
      'Status',
      'Due Date',
      'Created Date',
      'Updated Date'
    ];

    if (includeLineItems) {
      headers.push('Line Items Count', 'Line Items Summary');
    }

    if (includePayments) {
      headers.push('Payments Count', 'Total Paid', 'Payment Summary');
    }

    // Data rows
    const rows = data.map(invoice => {
      const row = [
        invoice.id || '',
        invoice.customer_name || '',
        invoice.customer_email || '',
        parseFloat(invoice.amount) || 0,
        invoice.currency || 'USD',
        invoice.status || '',
        this.formatDate(invoice.due_date),
        this.formatDate(invoice.created_at),
        this.formatDate(invoice.updated_at)
      ];

      if (includeLineItems) {
        const lineItems = invoice.line_items || [];
        row.push(lineItems.length);
        row.push(lineItems.map(item => 
          `${item.description || 'No description'} (${item.quantity || 0} × ${item.unit_price || 0})`
        ).join('\n'));
      }

      if (includePayments) {
        const payments = invoice.payments || [];
        const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
        row.push(payments.length);
        row.push(totalPaid);
        row.push(payments.map(payment => 
          `${payment.amount || 0} ${payment.currency || 'USD'} (${this.formatDate(payment.created_at)})`
        ).join('\n'));
      }

      return row;
    });

    return [headers, ...rows];
  }

  /**
   * Prepare line items data for separate Excel sheet
   */
  static prepareLineItemsDataForExcel(data) {
    const headers = ['Invoice ID', 'Description', 'Quantity', 'Unit Price', 'Total', 'Currency'];
    const rows = [];

    data.forEach(invoice => {
      const lineItems = invoice.line_items || [];
      lineItems.forEach(item => {
        rows.push([
          invoice.id || '',
          item.description || '',
          parseFloat(item.quantity) || 0,
          parseFloat(item.unit_price) || 0,
          parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0),
          invoice.currency || 'USD'
        ]);
      });
    });

    return [headers, ...rows];
  }

  /**
   * Prepare payments data for separate Excel sheet
   */
  static preparePaymentsDataForExcel(data) {
    const headers = ['Invoice ID', 'Amount', 'Currency', 'Payment Method', 'Reference', 'Date', 'Status'];
    const rows = [];

    data.forEach(invoice => {
      const payments = invoice.payments || [];
      payments.forEach(payment => {
        rows.push([
          invoice.id || '',
          parseFloat(payment.amount) || 0,
          payment.currency || 'USD',
          payment.payment_method || '',
          payment.reference || '',
          this.formatDate(payment.created_at),
          payment.status || ''
        ]);
      });
    });

    return [headers, ...rows];
  }

  /**
   * Prepare summary data for Excel
   */
  static prepareSummaryDataForExcel(data) {
    const totalInvoices = data.length;
    const totalAmount = data.reduce((sum, invoice) => sum + parseFloat(invoice.amount || 0), 0);
    const statusCounts = data.reduce((counts, invoice) => {
      counts[invoice.status] = (counts[invoice.status] || 0) + 1;
      return counts;
    }, {});
    const currencies = [...new Set(data.map(invoice => invoice.currency))];

    const summaryData = [
      ['Export Summary', ''],
      ['Generated Date', this.formatDate(new Date())],
      ['', ''],
      ['Statistics', ''],
      ['Total Invoices', totalInvoices],
      ['Total Amount', totalAmount.toFixed(2)],
      ['Currencies', currencies.join(', ')],
      ['', ''],
      ['Status Breakdown', '']
    ];

    Object.entries(statusCounts).forEach(([status, count]) => {
      summaryData.push([status, count]);
    });

    return summaryData;
  }

  /**
   * Generate PDF export
   */
  static async generatePDFExport(data, options = {}) {
    try {
      const { includeLineItems = false, includePayments = false } = options;
      
      // Create a simple HTML table for PDF generation
      let htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice Export</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #f4f4f4; font-weight: bold; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .amount { text-align: right; }
    .status { padding: 4px 8px; border-radius: 4px; text-align: center; }
    .status-paid { background-color: #d4edda; color: #155724; }
    .status-sent { background-color: #d1ecf1; color: #0c5460; }
    .status-draft { background-color: #fff3cd; color: #856404; }
    .status-overdue { background-color: #f8d7da; color: #721c24; }
  </style>
</head>
<body>
  <h1>Invoice Export Report</h1>
  <p>Generated on: ${new Date().toLocaleString()}</p>
  <p>Total Invoices: ${data.length}</p>
`;

      // Create main invoice table
      htmlContent += `
  <table>
    <thead>
      <tr>
        <th>Invoice ID</th>
        <th>Client</th>
        <th>Amount</th>
        <th>Currency</th>
        <th>Status</th>
        <th>Due Date</th>
        <th>Created</th>
      </tr>
    </thead>
    <tbody>
`;

      data.forEach(invoice => {
        const statusClass = `status-${invoice.status.toLowerCase()}`;
        htmlContent += `
      <tr>
        <td>${invoice.id.substring(0, 8)}...</td>
        <td>${invoice.client_name || 'N/A'}</td>
        <td class="amount">${this.formatCurrency(invoice.amount, invoice.currency)}</td>
        <td>${invoice.currency}</td>
        <td><span class="status ${statusClass}">${invoice.status}</span></td>
        <td>${this.formatDate(invoice.due_date)}</td>
        <td>${this.formatDate(invoice.created_at)}</td>
      </tr>
`;
      });

      htmlContent += `
    </tbody>
  </table>
`;

      // Add line items if requested
      if (includeLineItems && data.some(invoice => invoice.lineItems && invoice.lineItems.length > 0)) {
        htmlContent += `
  <h2>Line Items Detail</h2>
`;
        data.forEach(invoice => {
          if (invoice.lineItems && invoice.lineItems.length > 0) {
            htmlContent += `
  <h3>Invoice: ${invoice.id.substring(0, 8)}... (${invoice.client_name || 'N/A'})</h3>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Quantity</th>
        <th>Unit Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
`;
            invoice.lineItems.forEach(item => {
              const total = (item.quantity * item.unit_price).toFixed(2);
              htmlContent += `
      <tr>
        <td>${item.description}</td>
        <td>${item.quantity}</td>
        <td class="amount">${this.formatCurrency(item.unit_price, invoice.currency)}</td>
        <td class="amount">${this.formatCurrency(total, invoice.currency)}</td>
      </tr>
`;
            });
            htmlContent += `
    </tbody>
  </table>
`;
          }
        });
      }

      // Add payments if requested  
      if (includePayments && data.some(invoice => invoice.payments && invoice.payments.length > 0)) {
        htmlContent += `
  <h2>Payment Details</h2>
`;
        data.forEach(invoice => {
          if (invoice.payments && invoice.payments.length > 0) {
            htmlContent += `
  <h3>Invoice: ${invoice.id.substring(0, 8)}... (${invoice.client_name || 'N/A'})</h3>
  <table>
    <thead>
      <tr>
        <th>Payment Date</th>
        <th>Amount</th>
        <th>Method</th>
        <th>Reference</th>
      </tr>
    </thead>
    <tbody>
`;
            invoice.payments.forEach(payment => {
              htmlContent += `
      <tr>
        <td>${this.formatDate(payment.payment_date)}</td>
        <td class="amount">${this.formatCurrency(payment.amount, invoice.currency)}</td>
        <td>${payment.payment_method || 'N/A'}</td>
        <td>${payment.reference_number || 'N/A'}</td>
      </tr>
`;
            });
            htmlContent += `
    </tbody>
  </table>
`;
          }
        });
      }

      htmlContent += `
</body>
</html>
`;

      // For now, return HTML content that can be converted to PDF by the client
      // In a production environment, you'd use puppeteer or similar to generate actual PDF
      return {
        success: true,
        data: htmlContent,
        filename: `invoice_export_${new Date().toISOString().split('T')[0]}.html`,
        mimeType: 'text/html'
      };
      
    } catch (error) {
      console.error('PDF export error:', error);
      return {
        success: false,
        message: `PDF export failed: ${error.message}`,
        data: null
      };
    }
  }

  /**
   * Format date for export
   */
  static formatDate(dateString) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    } catch (error) {
      return dateString;
    }
  }

  /**
   * Format currency for display
   */
  static formatCurrency(amount, currency = 'USD') {
    try {
      const numAmount = parseFloat(amount) || 0;
      // Simple currency formatting
      const symbols = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'ZMW': 'K',
        'ZAR': 'R'
      };
      
      const symbol = symbols[currency] || currency + ' ';
      return `${symbol}${numAmount.toFixed(2)}`;
    } catch (error) {
      return `${currency} ${amount}`;
    }
  }

  /**
   * Get export filename
   */
  static getExportFilename(format, prefix = 'invoices_export') {
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = format === 'excel' ? 'xlsx' : format;
    return `${prefix}_${timestamp}.${extension}`;
  }
}

module.exports = BulkExportService;