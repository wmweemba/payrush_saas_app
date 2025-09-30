-- Migration: Client Communication Logs and Notes System
-- Version: 009_client_communication_logs_notes
-- Date: 2025-09-30

-- Create client_notes table for internal notes and communication logs
CREATE TABLE IF NOT EXISTS client_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Note content and metadata
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    note_type VARCHAR(50) DEFAULT 'general' CHECK (note_type IN ('general', 'communication', 'follow_up', 'meeting', 'call', 'email', 'task', 'reminder')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Communication specific fields
    communication_method VARCHAR(50) CHECK (communication_method IN ('phone', 'email', 'whatsapp', 'sms', 'meeting', 'video_call', 'in_person')),
    communication_direction VARCHAR(20) CHECK (communication_direction IN ('inbound', 'outbound')),
    contact_person VARCHAR(255), -- Reference to contact person involved
    
    -- Task and follow-up fields
    is_task BOOLEAN DEFAULT false,
    is_completed BOOLEAN DEFAULT false,
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Follow-up and reminder fields
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date TIMESTAMPTZ,
    reminder_date TIMESTAMPTZ,
    reminder_sent BOOLEAN DEFAULT false,
    
    -- Collaboration fields
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    tags TEXT[], -- Array of tags for categorization
    
    -- Attachments and references
    attachments JSONB DEFAULT '[]'::jsonb, -- Array of attachment metadata
    related_invoice_id UUID, -- Optional reference to invoice
    related_payment_id UUID, -- Optional reference to payment
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for client_notes
CREATE INDEX IF NOT EXISTS idx_client_notes_client_id ON client_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_user_id ON client_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_type ON client_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_client_notes_priority ON client_notes(priority);
CREATE INDEX IF NOT EXISTS idx_client_notes_due_date ON client_notes(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_client_notes_follow_up ON client_notes(follow_up_date) WHERE follow_up_required = true;
CREATE INDEX IF NOT EXISTS idx_client_notes_reminder ON client_notes(reminder_date) WHERE reminder_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_client_notes_assigned_to ON client_notes(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_client_notes_created_at ON client_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_notes_tags ON client_notes USING GIN(tags);

-- Enable RLS on client_notes
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_notes
CREATE POLICY "Users can view notes for their clients" ON client_notes
    FOR SELECT TO authenticated
    USING (
        client_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create notes for their clients" ON client_notes
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid() AND
        client_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own notes" ON client_notes
    FOR UPDATE TO authenticated
    USING (
        user_id = auth.uid() AND
        client_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own notes" ON client_notes
    FOR DELETE TO authenticated
    USING (
        user_id = auth.uid() AND
        client_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
    );

-- Create client_interactions table for tracking all client touchpoints
CREATE TABLE IF NOT EXISTS client_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Interaction details
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('note', 'invoice_created', 'invoice_sent', 'payment_received', 'payment_reminder', 'contact_updated', 'address_updated', 'currency_updated')),
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb, -- Additional context data
    
    -- References
    related_note_id UUID REFERENCES client_notes(id) ON DELETE CASCADE,
    related_invoice_id UUID,
    related_payment_id UUID,
    
    -- Timestamps
    interaction_date TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for client_interactions
CREATE INDEX IF NOT EXISTS idx_client_interactions_client_id ON client_interactions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_interactions_user_id ON client_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_client_interactions_type ON client_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_client_interactions_date ON client_interactions(interaction_date DESC);

-- Enable RLS on client_interactions
ALTER TABLE client_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_interactions
CREATE POLICY "Users can view interactions for their clients" ON client_interactions
    FOR SELECT TO authenticated
    USING (
        client_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create interactions for their clients" ON client_interactions
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid() AND
        client_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
    );

-- Create client_reminders table for managing follow-ups and notifications
CREATE TABLE IF NOT EXISTS client_reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    note_id UUID REFERENCES client_notes(id) ON DELETE CASCADE,
    
    -- Reminder details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    reminder_type VARCHAR(50) DEFAULT 'follow_up' CHECK (reminder_type IN ('follow_up', 'payment_due', 'contract_renewal', 'meeting', 'call', 'custom')),
    
    -- Timing
    reminder_date TIMESTAMPTZ NOT NULL,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern VARCHAR(50) CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    next_reminder_date TIMESTAMPTZ,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'completed', 'dismissed', 'snoozed')),
    completed_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    snoozed_until TIMESTAMPTZ,
    
    -- Notification preferences
    notify_email BOOLEAN DEFAULT true,
    notify_in_app BOOLEAN DEFAULT true,
    notification_sent_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for client_reminders
CREATE INDEX IF NOT EXISTS idx_client_reminders_client_id ON client_reminders(client_id);
CREATE INDEX IF NOT EXISTS idx_client_reminders_user_id ON client_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_client_reminders_date ON client_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_client_reminders_status ON client_reminders(status);
CREATE INDEX IF NOT EXISTS idx_client_reminders_next_date ON client_reminders(next_reminder_date) WHERE next_reminder_date IS NOT NULL;

-- Enable RLS on client_reminders
ALTER TABLE client_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_reminders
CREATE POLICY "Users can manage reminders for their clients" ON client_reminders
    FOR ALL TO authenticated
    USING (
        client_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
    );

-- Create function to automatically create interaction records
CREATE OR REPLACE FUNCTION create_client_interaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Create interaction record for new notes
    IF TG_TABLE_NAME = 'client_notes' AND TG_OP = 'INSERT' THEN
        INSERT INTO client_interactions (
            client_id,
            user_id,
            interaction_type,
            description,
            related_note_id,
            metadata
        ) VALUES (
            NEW.client_id,
            NEW.user_id,
            'note',
            CASE 
                WHEN NEW.note_type = 'communication' THEN 'Communication: ' || NEW.title
                WHEN NEW.note_type = 'follow_up' THEN 'Follow-up: ' || NEW.title
                WHEN NEW.note_type = 'meeting' THEN 'Meeting: ' || NEW.title
                WHEN NEW.note_type = 'call' THEN 'Call: ' || NEW.title
                WHEN NEW.note_type = 'email' THEN 'Email: ' || NEW.title
                WHEN NEW.note_type = 'task' THEN 'Task: ' || NEW.title
                ELSE 'Note: ' || NEW.title
            END,
            NEW.id,
            jsonb_build_object(
                'note_type', NEW.note_type,
                'priority', NEW.priority,
                'communication_method', NEW.communication_method,
                'is_task', NEW.is_task
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic interaction tracking
DROP TRIGGER IF EXISTS trigger_create_note_interaction ON client_notes;
CREATE TRIGGER trigger_create_note_interaction
    AFTER INSERT ON client_notes
    FOR EACH ROW
    EXECUTE FUNCTION create_client_interaction();

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
DROP TRIGGER IF EXISTS trigger_client_notes_updated_at ON client_notes;
CREATE TRIGGER trigger_client_notes_updated_at
    BEFORE UPDATE ON client_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_client_reminders_updated_at ON client_reminders;
CREATE TRIGGER trigger_client_reminders_updated_at
    BEFORE UPDATE ON client_reminders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to get client activity timeline
CREATE OR REPLACE FUNCTION get_client_activity_timeline(client_uuid UUID, user_uuid UUID, limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
    id UUID,
    activity_type VARCHAR(50),
    title TEXT,
    description TEXT,
    created_at TIMESTAMPTZ,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.interaction_type as activity_type,
        CASE 
            WHEN i.interaction_type = 'note' THEN n.title
            ELSE i.description
        END as title,
        i.description,
        i.interaction_date as created_at,
        i.metadata
    FROM client_interactions i
    LEFT JOIN client_notes n ON i.related_note_id = n.id
    WHERE i.client_id = client_uuid 
        AND i.user_id = user_uuid
    ORDER BY i.interaction_date DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add table comments
COMMENT ON TABLE client_notes IS 'Client notes, communication logs, tasks, and reminders';
COMMENT ON TABLE client_interactions IS 'Timeline of all client interactions and activities';
COMMENT ON TABLE client_reminders IS 'Client follow-up reminders and notifications';

-- Add column comments
COMMENT ON COLUMN client_notes.note_type IS 'Type of note: general, communication, follow_up, meeting, call, email, task, reminder';
COMMENT ON COLUMN client_notes.priority IS 'Priority level: low, normal, high, urgent';
COMMENT ON COLUMN client_notes.communication_method IS 'Method of communication: phone, email, whatsapp, sms, meeting, video_call, in_person';
COMMENT ON COLUMN client_notes.communication_direction IS 'Direction: inbound or outbound';
COMMENT ON COLUMN client_notes.tags IS 'Array of tags for categorization and filtering';
COMMENT ON COLUMN client_notes.attachments IS 'JSON array of attachment metadata';
COMMENT ON COLUMN client_interactions.interaction_type IS 'Type of interaction for timeline tracking';
COMMENT ON COLUMN client_reminders.reminder_type IS 'Type of reminder: follow_up, payment_due, contract_renewal, meeting, call, custom';