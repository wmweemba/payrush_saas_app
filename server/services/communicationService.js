/**
 * Communication Service
 * 
 * Handles client notes, communication logs, interactions, and reminders
 */

const { supabase } = require('../config/database');

class CommunicationService {
  // Note types configuration
  static NOTE_TYPES = {
    general: { label: 'General Note', icon: '📝', color: 'gray' },
    communication: { label: 'Communication', icon: '💬', color: 'blue' },
    follow_up: { label: 'Follow-up', icon: '📋', color: 'yellow' },
    meeting: { label: 'Meeting', icon: '🤝', color: 'green' },
    call: { label: 'Phone Call', icon: '📞', color: 'purple' },
    email: { label: 'Email', icon: '📧', color: 'indigo' },
    task: { label: 'Task', icon: '✅', color: 'orange' },
    reminder: { label: 'Reminder', icon: '⏰', color: 'red' }
  };

  // Priority levels
  static PRIORITY_LEVELS = {
    low: { label: 'Low', color: 'gray', value: 1 },
    normal: { label: 'Normal', color: 'blue', value: 2 },
    high: { label: 'High', color: 'orange', value: 3 },
    urgent: { label: 'Urgent', color: 'red', value: 4 }
  };

  // Communication methods
  static COMMUNICATION_METHODS = {
    phone: { label: 'Phone Call', icon: '📞' },
    email: { label: 'Email', icon: '📧' },
    whatsapp: { label: 'WhatsApp', icon: '💚' },
    sms: { label: 'SMS', icon: '💬' },
    meeting: { label: 'Meeting', icon: '🤝' },
    video_call: { label: 'Video Call', icon: '📹' },
    in_person: { label: 'In Person', icon: '👥' }
  };

  /**
   * Get all client notes with pagination and filtering
   */
  static async getClientNotes(clientId, userId, options = {}) {
    try {
      const {
        limit = 20,
        offset = 0,
        noteType,
        priority,
        tags,
        search,
        startDate,
        endDate,
        includeCompleted = true
      } = options;

      let query = supabase
        .from('client_notes')
        .select(`
          *,
          assigned_user:assigned_to(id, email)
        `)
        .eq('client_id', clientId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (noteType) {
        query = query.eq('note_type', noteType);
      }

      if (priority) {
        query = query.eq('priority', priority);
      }

      if (!includeCompleted) {
        query = query.eq('is_completed', false);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      if (tags && tags.length > 0) {
        query = query.overlaps('tags', tags);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching client notes:', error);
        return {
          success: false,
          error: error.message,
          statusCode: 400
        };
      }

      // Add metadata to notes
      const notesWithMetadata = data.map(note => ({
        ...note,
        note_type_metadata: this.NOTE_TYPES[note.note_type] || this.NOTE_TYPES.general,
        priority_metadata: this.PRIORITY_LEVELS[note.priority] || this.PRIORITY_LEVELS.normal,
        communication_method_metadata: note.communication_method 
          ? this.COMMUNICATION_METHODS[note.communication_method] 
          : null
      }));

      return {
        success: true,
        data: {
          notes: notesWithMetadata,
          total: count,
          hasMore: offset + limit < count
        }
      };
    } catch (error) {
      console.error('Error in getClientNotes:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Create a new client note
   */
  static async createClientNote(clientId, userId, noteData) {
    try {
      const {
        title,
        content,
        note_type = 'general',
        priority = 'normal',
        communication_method,
        communication_direction,
        contact_person,
        is_task = false,
        due_date,
        follow_up_required = false,
        follow_up_date,
        reminder_date,
        assigned_to,
        tags = [],
        attachments = [],
        related_invoice_id,
        related_payment_id
      } = noteData;

      // Validate required fields
      if (!title || !content) {
        return {
          success: false,
          error: 'Title and content are required',
          statusCode: 400
        };
      }

      // Validate note type
      if (!Object.keys(this.NOTE_TYPES).includes(note_type)) {
        return {
          success: false,
          error: 'Invalid note type',
          statusCode: 400
        };
      }

      // Validate priority
      if (!Object.keys(this.PRIORITY_LEVELS).includes(priority)) {
        return {
          success: false,
          error: 'Invalid priority level',
          statusCode: 400
        };
      }

      const { data, error } = await supabase
        .from('client_notes')
        .insert({
          client_id: clientId,
          user_id: userId,
          title,
          content,
          note_type,
          priority,
          communication_method,
          communication_direction,
          contact_person,
          is_task,
          due_date,
          follow_up_required,
          follow_up_date,
          reminder_date,
          assigned_to,
          tags,
          attachments,
          related_invoice_id,
          related_payment_id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating client note:', error);
        return {
          success: false,
          error: error.message,
          statusCode: 400
        };
      }

      // Create reminder if needed
      if (reminder_date) {
        await this.createReminder(clientId, userId, {
          title: `Reminder: ${title}`,
          description: content,
          reminder_date,
          note_id: data.id,
          reminder_type: 'follow_up'
        });
      }

      return {
        success: true,
        data: {
          ...data,
          note_type_metadata: this.NOTE_TYPES[data.note_type],
          priority_metadata: this.PRIORITY_LEVELS[data.priority]
        }
      };
    } catch (error) {
      console.error('Error in createClientNote:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Update a client note
   */
  static async updateClientNote(noteId, userId, updates) {
    try {
      const { data, error } = await supabase
        .from('client_notes')
        .update(updates)
        .eq('id', noteId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating client note:', error);
        return {
          success: false,
          error: error.message,
          statusCode: 400
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error in updateClientNote:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Delete a client note
   */
  static async deleteClientNote(noteId, userId) {
    try {
      const { error } = await supabase
        .from('client_notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting client note:', error);
        return {
          success: false,
          error: error.message,
          statusCode: 400
        };
      }

      return {
        success: true,
        data: { deleted: true }
      };
    } catch (error) {
      console.error('Error in deleteClientNote:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Get client activity timeline
   */
  static async getClientTimeline(clientId, userId, options = {}) {
    try {
      const { limit = 50 } = options;

      const { data, error } = await supabase
        .rpc('get_client_activity_timeline', {
          client_uuid: clientId,
          user_uuid: userId,
          limit_count: limit
        });

      if (error) {
        console.error('Error fetching client timeline:', error);
        return {
          success: false,
          error: error.message,
          statusCode: 400
        };
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Error in getClientTimeline:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Get client reminders
   */
  static async getClientReminders(clientId, userId, options = {}) {
    try {
      const { 
        status = 'pending',
        upcoming_only = false,
        limit = 20,
        offset = 0 
      } = options;

      let query = supabase
        .from('client_reminders')
        .select('*')
        .eq('client_id', clientId)
        .eq('user_id', userId)
        .order('reminder_date', { ascending: true })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      if (upcoming_only) {
        query = query.gte('reminder_date', new Date().toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching client reminders:', error);
        return {
          success: false,
          error: error.message,
          statusCode: 400
        };
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Error in getClientReminders:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Create a reminder
   */
  static async createReminder(clientId, userId, reminderData) {
    try {
      const { data, error } = await supabase
        .from('client_reminders')
        .insert({
          client_id: clientId,
          user_id: userId,
          ...reminderData
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating reminder:', error);
        return {
          success: false,
          error: error.message,
          statusCode: 400
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error in createReminder:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }

  /**
   * Get communication statistics for a client
   */
  static async getClientCommunicationStats(clientId, userId) {
    try {
      // Get note counts by type
      const { data: noteCounts, error: noteError } = await supabase
        .from('client_notes')
        .select('note_type')
        .eq('client_id', clientId)
        .eq('user_id', userId);

      if (noteError) {
        console.error('Error fetching note counts:', noteError);
        return {
          success: false,
          error: noteError.message,
          statusCode: 400
        };
      }

      // Get pending tasks count
      const { count: pendingTasks, error: taskError } = await supabase
        .from('client_notes')
        .select('id', { count: 'exact' })
        .eq('client_id', clientId)
        .eq('user_id', userId)
        .eq('is_task', true)
        .eq('is_completed', false);

      if (taskError) {
        console.error('Error fetching pending tasks:', taskError);
      }

      // Get upcoming reminders count
      const { count: upcomingReminders, error: reminderError } = await supabase
        .from('client_reminders')
        .select('id', { count: 'exact' })
        .eq('client_id', clientId)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .gte('reminder_date', new Date().toISOString());

      if (reminderError) {
        console.error('Error fetching upcoming reminders:', reminderError);
      }

      // Process note type counts
      const noteTypeStats = {};
      Object.keys(this.NOTE_TYPES).forEach(type => {
        noteTypeStats[type] = noteCounts.filter(note => note.note_type === type).length;
      });

      return {
        success: true,
        data: {
          total_notes: noteCounts.length,
          note_type_breakdown: noteTypeStats,
          pending_tasks: pendingTasks || 0,
          upcoming_reminders: upcomingReminders || 0,
          last_activity: noteCounts.length > 0 ? new Date().toISOString() : null
        }
      };
    } catch (error) {
      console.error('Error in getClientCommunicationStats:', error);
      return {
        success: false,
        error: 'Internal server error',
        statusCode: 500
      };
    }
  }
}

module.exports = CommunicationService;