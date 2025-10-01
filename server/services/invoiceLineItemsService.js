/**
 * Invoice Line Items Service
 * 
 * Business logic for managing invoice line items with CRUD operations
 */

const { supabase } = require('../config/database');
const { sanitizeString } = require('../utils');

class InvoiceLineItemsService {
  constructor() {
    this.supabase = supabase;
  }

  /**
   * Get all line items for a specific invoice
   */
  async getInvoiceLineItems(invoiceId, userId) {
    try {
      // First verify the invoice belongs to the user
      const { data: invoice } = await this.supabase
        .from('invoices')
        .select('id, user_id')
        .eq('id', invoiceId)
        .eq('user_id', userId)
        .single();

      if (!invoice) {
        return {
          success: false,
          error: 'Invoice not found or access denied',
          statusCode: 404
        };
      }

      // Get line items for the invoice
      const { data: lineItems, error } = await this.supabase
        .from('invoice_items')
        .select(`
          id,
          description,
          quantity,
          unit_price,
          line_total,
          sort_order,
          created_at,
          updated_at
        `)
        .eq('invoice_id', invoiceId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to get invoice line items: ${error.message}`);
      }

      return {
        success: true,
        data: { 
          lineItems: lineItems || [],
          invoiceId: invoiceId
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Create a new line item for an invoice
   */
  async createLineItem(invoiceId, userId, lineItemData) {
    try {
      // Verify the invoice belongs to the user
      const { data: invoice } = await this.supabase
        .from('invoices')
        .select('id, user_id, is_line_item_invoice')
        .eq('id', invoiceId)
        .eq('user_id', userId)
        .single();

      if (!invoice) {
        return {
          success: false,
          error: 'Invoice not found or access denied',
          statusCode: 404
        };
      }

      // Validate line item data
      const { description, quantity, unit_price, sort_order } = lineItemData;
      
      if (!description || description.trim().length === 0) {
        return {
          success: false,
          error: 'Description is required',
          statusCode: 400
        };
      }

      if (!quantity || quantity <= 0) {
        return {
          success: false,
          error: 'Quantity must be greater than 0',
          statusCode: 400
        };
      }

      if (unit_price === undefined || unit_price < 0) {
        return {
          success: false,
          error: 'Unit price must be 0 or greater',
          statusCode: 400
        };
      }

      // If this is the first line item, mark the invoice as a line item invoice
      if (!invoice.is_line_item_invoice) {
        const { error: updateError } = await this.supabase
          .from('invoices')
          .update({ is_line_item_invoice: true })
          .eq('id', invoiceId);

        if (updateError) {
          console.warn('Failed to update invoice line item flag:', updateError.message);
        }
      }

      // Create the line item
      const { data: lineItem, error } = await this.supabase
        .from('invoice_items')
        .insert({
          invoice_id: invoiceId,
          description: sanitizeString(description.trim()),
          quantity: parseFloat(quantity),
          unit_price: parseFloat(unit_price),
          sort_order: sort_order || 0
        })
        .select(`
          id,
          description,
          quantity,
          unit_price,
          line_total,
          sort_order,
          created_at,
          updated_at
        `)
        .single();

      if (error) {
        throw new Error(`Failed to create line item: ${error.message}`);
      }

      return {
        success: true,
        data: { lineItem }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Update an existing line item
   */
  async updateLineItem(lineItemId, userId, lineItemData) {
    try {
      // Verify the line item belongs to the user (through invoice ownership)
      const { data: lineItemCheck } = await this.supabase
        .from('invoice_items')
        .select(`
          id,
          invoice_id,
          invoices!inner(user_id)
        `)
        .eq('id', lineItemId)
        .eq('invoices.user_id', userId)
        .single();

      if (!lineItemCheck) {
        return {
          success: false,
          error: 'Line item not found or access denied',
          statusCode: 404
        };
      }

      // Validate update data
      const updates = {};
      const { description, quantity, unit_price, sort_order } = lineItemData;

      if (description !== undefined) {
        if (!description || description.trim().length === 0) {
          return {
            success: false,
            error: 'Description cannot be empty',
            statusCode: 400
          };
        }
        updates.description = sanitizeString(description.trim());
      }

      if (quantity !== undefined) {
        if (quantity <= 0) {
          return {
            success: false,
            error: 'Quantity must be greater than 0',
            statusCode: 400
          };
        }
        updates.quantity = parseFloat(quantity);
      }

      if (unit_price !== undefined) {
        if (unit_price < 0) {
          return {
            success: false,
            error: 'Unit price cannot be negative',
            statusCode: 400
          };
        }
        updates.unit_price = parseFloat(unit_price);
      }

      if (sort_order !== undefined) {
        updates.sort_order = parseInt(sort_order);
      }

      if (Object.keys(updates).length === 0) {
        return {
          success: false,
          error: 'No valid fields to update',
          statusCode: 400
        };
      }

      // Update the line item
      const { data: lineItem, error } = await this.supabase
        .from('invoice_items')
        .update(updates)
        .eq('id', lineItemId)
        .select(`
          id,
          description,
          quantity,
          unit_price,
          line_total,
          sort_order,
          created_at,
          updated_at
        `)
        .single();

      if (error) {
        throw new Error(`Failed to update line item: ${error.message}`);
      }

      return {
        success: true,
        data: { lineItem }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Delete a line item
   */
  async deleteLineItem(lineItemId, userId) {
    try {
      // Verify the line item belongs to the user (through invoice ownership)
      const { data: lineItemCheck } = await this.supabase
        .from('invoice_items')
        .select(`
          id,
          invoice_id,
          invoices!inner(user_id)
        `)
        .eq('id', lineItemId)
        .eq('invoices.user_id', userId)
        .single();

      if (!lineItemCheck) {
        return {
          success: false,
          error: 'Line item not found or access denied',
          statusCode: 404
        };
      }

      // Delete the line item
      const { error } = await this.supabase
        .from('invoice_items')
        .delete()
        .eq('id', lineItemId);

      if (error) {
        throw new Error(`Failed to delete line item: ${error.message}`);
      }

      // Check if this was the last line item for the invoice
      const { data: remainingItems } = await this.supabase
        .from('invoice_items')
        .select('id')
        .eq('invoice_id', lineItemCheck.invoice_id);

      // If no more line items, optionally mark invoice as simple invoice again
      if (!remainingItems || remainingItems.length === 0) {
        const { error: updateError } = await this.supabase
          .from('invoices')
          .update({ 
            is_line_item_invoice: false,
            calculated_total: null
          })
          .eq('id', lineItemCheck.invoice_id);

        if (updateError) {
          console.warn('Failed to update invoice line item flag:', updateError.message);
        }
      }

      return {
        success: true,
        data: { 
          deletedLineItemId: lineItemId,
          invoiceId: lineItemCheck.invoice_id
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Bulk create multiple line items for an invoice
   */
  async createMultipleLineItems(invoiceId, userId, lineItemsData) {
    try {
      // Verify the invoice belongs to the user
      const { data: invoice } = await this.supabase
        .from('invoices')
        .select('id, user_id, is_line_item_invoice')
        .eq('id', invoiceId)
        .eq('user_id', userId)
        .single();

      if (!invoice) {
        return {
          success: false,
          error: 'Invoice not found or access denied',
          statusCode: 404
        };
      }

      if (!Array.isArray(lineItemsData) || lineItemsData.length === 0) {
        return {
          success: false,
          error: 'Line items data must be a non-empty array',
          statusCode: 400
        };
      }

      // Validate all line items before creating any
      const validatedItems = [];
      for (let i = 0; i < lineItemsData.length; i++) {
        const item = lineItemsData[i];
        const { description, quantity, unit_price } = item;

        if (!description || description.trim().length === 0) {
          return {
            success: false,
            error: `Line item ${i + 1}: Description is required`,
            statusCode: 400
          };
        }

        if (!quantity || quantity <= 0) {
          return {
            success: false,
            error: `Line item ${i + 1}: Quantity must be greater than 0`,
            statusCode: 400
          };
        }

        if (unit_price === undefined || unit_price < 0) {
          return {
            success: false,
            error: `Line item ${i + 1}: Unit price must be 0 or greater`,
            statusCode: 400
          };
        }

        validatedItems.push({
          invoice_id: invoiceId,
          description: sanitizeString(description.trim()),
          quantity: parseFloat(quantity),
          unit_price: parseFloat(unit_price),
          sort_order: item.sort_order || i
        });
      }

      // Mark invoice as line item invoice if not already
      if (!invoice.is_line_item_invoice) {
        const { error: updateError } = await this.supabase
          .from('invoices')
          .update({ is_line_item_invoice: true })
          .eq('id', invoiceId);

        if (updateError) {
          console.warn('Failed to update invoice line item flag:', updateError.message);
        }
      }

      // Create all line items
      const { data: lineItems, error } = await this.supabase
        .from('invoice_items')
        .insert(validatedItems)
        .select(`
          id,
          description,
          quantity,
          unit_price,
          line_total,
          sort_order,
          created_at,
          updated_at
        `);

      if (error) {
        throw new Error(`Failed to create line items: ${error.message}`);
      }

      return {
        success: true,
        data: { 
          lineItems: lineItems || [],
          createdCount: lineItems ? lineItems.length : 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Reorder line items for an invoice
   */
  async reorderLineItems(invoiceId, userId, itemOrder) {
    try {
      // Verify the invoice belongs to the user
      const { data: invoice } = await this.supabase
        .from('invoices')
        .select('id, user_id')
        .eq('id', invoiceId)
        .eq('user_id', userId)
        .single();

      if (!invoice) {
        return {
          success: false,
          error: 'Invoice not found or access denied',
          statusCode: 404
        };
      }

      if (!Array.isArray(itemOrder) || itemOrder.length === 0) {
        return {
          success: false,
          error: 'Item order must be a non-empty array',
          statusCode: 400
        };
      }

      // Update sort orders for each item
      const updates = itemOrder.map((item, index) => ({
        id: item.id,
        sort_order: index
      }));

      // Perform bulk update
      const updatePromises = updates.map(update =>
        this.supabase
          .from('invoice_items')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id)
          .eq('invoice_id', invoiceId) // Additional security check
      );

      await Promise.all(updatePromises);

      return {
        success: true,
        data: { 
          message: 'Line items reordered successfully',
          updatedCount: updates.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        statusCode: 500
      };
    }
  }

  /**
   * Get invoice summary with line items
   */
  async getInvoiceWithLineItems(invoiceId, userId) {
    try {
      // Get invoice details
      const { data: invoice, error: invoiceError } = await this.supabase
        .from('invoices')
        .select(`
          id,
          user_id,
          customer_name,
          customer_email,
          amount,
          currency,
          status,
          due_date,
          created_at,
          updated_at,
          is_line_item_invoice,
          calculated_total
        `)
        .eq('id', invoiceId)
        .eq('user_id', userId)
        .single();

      if (invoiceError || !invoice) {
        return {
          success: false,
          error: 'Invoice not found or access denied',
          statusCode: 404
        };
      }

      // Get line items if it's a line item invoice
      let lineItems = [];
      if (invoice.is_line_item_invoice) {
        const lineItemsResult = await this.getInvoiceLineItems(invoiceId, userId);
        if (lineItemsResult.success) {
          lineItems = lineItemsResult.data.lineItems;
        }
      }

      // Calculate final amount
      const finalAmount = invoice.is_line_item_invoice 
        ? (invoice.calculated_total || 0)
        : (invoice.amount || 0);

      return {
        success: true,
        data: {
          invoice: {
            ...invoice,
            final_amount: finalAmount,
            line_items: lineItems,
            line_item_count: lineItems.length
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        statusCode: 500
      };
    }
  }
}

// Export singleton instance
module.exports = new InvoiceLineItemsService();