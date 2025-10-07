/**
 * Invoice Notes Service
 * 
 * Business logic for invoice notes and comments management operations
 */

const { supabase } = require('../config/database');
const { sanitizeString } = require('../utils');

class InvoiceNotesService {
  constructor() {
    this.supabase = supabase;
  }

  /**
   * Get all notes for a specific invoice
   */
  async getInvoiceNotes(invoiceId, userId, options = {}) {
    try {
      const { 
        noteType, 
        includeSystem = true,
        limit = 50, 
        offset = 0, 
        sortBy = 'created_at', 
        sortOrder = 'desc' 
      } = options;

      // First verify the invoice belongs to the user
      const { data: invoice, error: invoiceError } = await this.supabase
        .from('invoices')
        .select('id')
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

      let query = this.supabase
        .from('invoice_notes')
        .select(`
          id,
          note_type,
          note_text,
          is_visible_to_customer,
          priority,
          is_pinned,
          is_resolved,
          created_by_name,
          updated_by_name,
          created_at,
          updated_at
        `)
        .eq('invoice_id', invoiceId);

      // Add filters
      if (noteType) {
        query = query.eq('note_type', noteType);
      }

      if (!includeSystem) {
        query = query.eq('is_system_generated', false);
      }

      // Add sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Add pagination
      if (limit) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Database error in getInvoiceNotes:', error);
        return {
          success: false,
          error: 'Failed to retrieve invoice notes',
          statusCode: 500
        };
      }

      return {
        success: true,
        data: {
          notes: data || [],
          pagination: {
            total: count,
            limit,
            offset,
            page: Math.floor(offset / limit) + 1
          }
        }
      };
    } catch (error) {
      console.error('Error in getInvoiceNotes:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Get a specific note by ID
   */
  async getNote(noteId, userId) {
    try {
      const { data, error } = await this.supabase
        .from('invoice_notes')
        .select(`
          *,
          invoices!inner(user_id)
        `)
        .eq('id', noteId)
        .eq('invoices.user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Note not found',
            statusCode: 404
          };
        }
        console.error('Database error in getNote:', error);
        return {
          success: false,
          error: 'Failed to retrieve note',
          statusCode: 500
        };
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Error in getNote:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Create a new note
   */
  async createNote(invoiceId, userId, noteData) {
    try {
      // Validate required fields
      if (!noteData.content) {
        return {
          success: false,
          error: 'Note content is required',
          statusCode: 400
        };
      }

      // First verify the invoice belongs to the user
      const { data: invoice, error: invoiceError } = await this.supabase
        .from('invoices')
        .select('id')
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

      // Sanitize and prepare data
      const insertData = {
        invoice_id: invoiceId,
        user_id: userId,
        note_type: noteData.note_type || 'internal',
        note_text: sanitizeString(noteData.content),
        is_visible_to_customer: noteData.is_visible_to_customer || false,
        priority: noteData.priority || 'normal',
        is_pinned: noteData.is_pinned || false,
        is_resolved: noteData.is_resolved || false,
        created_by_name: noteData.created_by_name || null,
        updated_by_name: noteData.updated_by_name || null
      };

      // Validate fields
      const validNoteTypes = ['internal', 'customer', 'system'];
      if (!validNoteTypes.includes(insertData.note_type)) {
        return {
          success: false,
          error: 'Invalid note type',
          statusCode: 400
        };
      }

      const validPriorities = ['low', 'normal', 'high', 'urgent'];
      if (!validPriorities.includes(insertData.priority)) {
        return {
          success: false,
          error: 'Invalid priority level',
          statusCode: 400
        };
      }

      const { data, error } = await this.supabase
        .from('invoice_notes')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Database error in createNote:', error);
        return {
          success: false,
          error: 'Failed to create note',
          statusCode: 500
        };
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Error in createNote:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Update an existing note
   */
  async updateNote(noteId, userId, updateData) {
    try {
      // First check if note exists and belongs to user's invoice
      const existingNote = await this.getNote(noteId, userId);
      if (!existingNote.success) {
        return existingNote;
      }

      // Don't allow updating system-generated notes (remove this check as schema doesn't have this field)
      
      // Prepare update data
      const updateFields = {};

      if (updateData.title !== undefined) {
        // Title is stored in note_text field
        updateFields.note_text = updateData.title ? sanitizeString(updateData.title) : '';
      }

      if (updateData.content !== undefined) {
        if (!updateData.content) {
          return {
            success: false,
            error: 'Note content cannot be empty',
            statusCode: 400
          };
        }
        updateFields.note_text = sanitizeString(updateData.content);
      }

      if (updateData.note_type !== undefined) {
        const validNoteTypes = ['internal', 'customer', 'system'];
        if (!validNoteTypes.includes(updateData.note_type)) {
          return {
            success: false,
            error: 'Invalid note type',
            statusCode: 400
          };
        }
        updateFields.note_type = updateData.note_type;
      }

      if (updateData.is_visible_to_customer !== undefined) {
        updateFields.is_visible_to_customer = updateData.is_visible_to_customer;
      }

      if (updateData.priority !== undefined) {
        const validPriorities = ['low', 'normal', 'high', 'urgent'];
        if (!validPriorities.includes(updateData.priority)) {
          return {
            success: false,
            error: 'Invalid priority level',
            statusCode: 400
          };
        }
        updateFields.priority = updateData.priority;
      }

      if (Object.keys(updateFields).length === 0) {
        return {
          success: false,
          error: 'No fields to update',
          statusCode: 400
        };
      }

      const { data, error } = await this.supabase
        .from('invoice_notes')
        .update(updateFields)
        .eq('id', noteId)
        .select()
        .single();

      if (error) {
        console.error('Database error in updateNote:', error);
        return {
          success: false,
          error: 'Failed to update note',
          statusCode: 500
        };
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Error in updateNote:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId, userId) {
    try {
      // First check if note exists and belongs to user's invoice
      const existingNote = await this.getNote(noteId, userId);
      if (!existingNote.success) {
        return existingNote;
      }

      const { error } = await this.supabase
        .from('invoice_notes')
        .delete()
        .eq('id', noteId);

      if (error) {
        console.error('Database error in deleteNote:', error);
        return {
          success: false,
          error: 'Failed to delete note',
          statusCode: 500
        };
      }

      return {
        success: true,
        data: { message: 'Note deleted successfully' }
      };
    } catch (error) {
      console.error('Error in deleteNote:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Get notes summary for an invoice
   */
  async getNoteSummary(invoiceId, userId) {
    try {
      // First verify the invoice belongs to the user
      const { data: invoice, error: invoiceError } = await this.supabase
        .from('invoices')
        .select('id')
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

      // Get count by note type
      const { data: summary, error } = await this.supabase
        .from('invoice_notes')
        .select('note_type, priority, is_visible_to_customer')
        .eq('invoice_id', invoiceId);

      if (error) {
        console.error('Database error in getNoteSummary:', error);
        return {
          success: false,
          error: 'Failed to retrieve note summary',
          statusCode: 500
        };
      }

      // Process summary data
      const summaryData = {
        total_notes: summary.length,
        by_type: {
          internal: summary.filter(n => n.note_type === 'internal').length,
          customer: summary.filter(n => n.note_type === 'customer').length,
          system: summary.filter(n => n.note_type === 'system').length
        },
        by_priority: {
          low: summary.filter(n => n.priority === 'low').length,
          normal: summary.filter(n => n.priority === 'normal').length,
          high: summary.filter(n => n.priority === 'high').length,
          urgent: summary.filter(n => n.priority === 'urgent').length
        },
        customer_visible: summary.filter(n => n.is_visible_to_customer).length,
        last_note_date: summary.length > 0 ? new Date().toISOString() : null
      };

      return {
        success: true,
        data: summaryData
      };
    } catch (error) {
      console.error('Error in getNoteSummary:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Get customer-facing notes for an invoice (for public invoice view)
   */
  async getCustomerNotes(invoiceId) {
    try {
      const { data, error } = await this.supabase
        .from('invoice_notes')
        .select(`
          id,
          note_text,
          priority,
          created_at,
          updated_at
        `)
        .eq('invoice_id', invoiceId)
        .eq('note_type', 'customer')
        .eq('is_visible_to_customer', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error in getCustomerNotes:', error);
        return {
          success: false,
          error: 'Failed to retrieve customer notes',
          statusCode: 500
        };
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Error in getCustomerNotes:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Bulk create notes (useful for system events)
   */
  async bulkCreateNotes(notesData) {
    try {
      const { data, error } = await this.supabase
        .from('invoice_notes')
        .insert(notesData)
        .select();

      if (error) {
        console.error('Database error in bulkCreateNotes:', error);
        return {
          success: false,
          error: 'Failed to create notes',
          statusCode: 500
        };
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Error in bulkCreateNotes:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Search notes across all user's invoices
   */
  async searchNotes(userId, searchQuery, options = {}) {
    try {
      const { 
        noteType, 
        priority,
        invoiceId,
        limit = 50, 
        offset = 0 
      } = options;

      let query = this.supabase
        .from('invoice_notes')
        .select(`
          id,
          invoice_id,
          note_type,
          note_text,
          priority,
          is_visible_to_customer,
          created_at,
          invoices!inner(id, customer_name, status)
        `)
        .eq('user_id', userId);

      // Add search filter
      if (searchQuery) {
        query = query.or(`note_text.ilike.%${searchQuery}%`);
      }

      // Add filters
      if (noteType) {
        query = query.eq('note_type', noteType);
      }

      if (priority) {
        query = query.eq('priority', priority);
      }

      if (invoiceId) {
        query = query.eq('invoice_id', invoiceId);
      }

      // Add sorting and pagination
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Database error in searchNotes:', error);
        return {
          success: false,
          error: 'Failed to search notes',
          statusCode: 500
        };
      }

      return {
        success: true,
        data: {
          notes: data || [],
          pagination: {
            total: count,
            limit,
            offset,
            page: Math.floor(offset / limit) + 1
          }
        }
      };
    } catch (error) {
      console.error('Error in searchNotes:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }
}

// Export singleton instance
module.exports = new InvoiceNotesService();