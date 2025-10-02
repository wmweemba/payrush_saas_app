-- Migration: Create/Update email_logs table for bulk email tracking
-- This migration creates or updates the email_logs table to track bulk email notifications
-- Made idempotent to handle cases where table already exists

-- Step 1: Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  subject TEXT NOT NULL,
  template_used VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  error_message TEXT,
  delivery_details JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add missing columns if they don't exist (for schema updates)
DO $$ 
DECLARE
    column_exists boolean;
BEGIN
    -- Check and add delivery_details if missing
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'email_logs' AND column_name = 'delivery_details'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE email_logs ADD COLUMN delivery_details JSONB DEFAULT '{}';
    END IF;
    
    -- Check and add metadata if missing
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'email_logs' AND column_name = 'metadata'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE email_logs ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
    
    -- Check and add scheduled_for if missing
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'email_logs' AND column_name = 'scheduled_for'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE email_logs ADD COLUMN scheduled_for TIMESTAMPTZ;
    END IF;
END $$;

-- Step 3: Create indexes for better query performance (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_invoice_id ON email_logs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON email_logs(recipient_email);

-- Step 4: Enable RLS if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'email_logs' AND rowsecurity = true
    ) THEN
        ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Step 5: Create RLS policies (with conditional creation)
DO $$ 
BEGIN
    -- Policy: Users can view own email logs
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'email_logs' AND policyname = 'Users can view own email logs'
    ) THEN
        CREATE POLICY "Users can view own email logs" ON email_logs
          FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    -- Policy: Users can insert own email logs
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'email_logs' AND policyname = 'Users can insert own email logs'
    ) THEN
        CREATE POLICY "Users can insert own email logs" ON email_logs
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    -- Policy: Users can update own email logs
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'email_logs' AND policyname = 'Users can update own email logs'
    ) THEN
        CREATE POLICY "Users can update own email logs" ON email_logs
          FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    -- Policy: Users can delete own email logs
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'email_logs' AND policyname = 'Users can delete own email logs'
    ) THEN
        CREATE POLICY "Users can delete own email logs" ON email_logs
          FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Step 6: Create function and trigger for updated_at (with conditional creation)
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at (with conditional creation)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_update_email_logs_updated_at'
    ) THEN
        CREATE TRIGGER trigger_update_email_logs_updated_at
          BEFORE UPDATE ON email_logs
          FOR EACH ROW
          EXECUTE FUNCTION update_email_logs_updated_at();
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE email_logs IS 'Tracks email notifications sent for invoices with delivery status and metadata';
COMMENT ON COLUMN email_logs.user_id IS 'ID of the user who sent the email';
COMMENT ON COLUMN email_logs.invoice_id IS 'ID of the related invoice';
COMMENT ON COLUMN email_logs.recipient_email IS 'Email address of the recipient';
COMMENT ON COLUMN email_logs.recipient_name IS 'Name of the email recipient';
COMMENT ON COLUMN email_logs.subject IS 'Email subject line';
COMMENT ON COLUMN email_logs.template_used IS 'Email template identifier used';
COMMENT ON COLUMN email_logs.status IS 'Current delivery status of the email';
COMMENT ON COLUMN email_logs.sent_at IS 'Timestamp when email was sent';
COMMENT ON COLUMN email_logs.delivered_at IS 'Timestamp when email was delivered';
COMMENT ON COLUMN email_logs.opened_at IS 'Timestamp when email was first opened';
COMMENT ON COLUMN email_logs.clicked_at IS 'Timestamp when email links were first clicked';
COMMENT ON COLUMN email_logs.scheduled_for IS 'Timestamp when email is scheduled to be sent';
COMMENT ON COLUMN email_logs.error_message IS 'Error message if email sending failed';
COMMENT ON COLUMN email_logs.delivery_details IS 'JSON object containing delivery provider details and tracking information';
COMMENT ON COLUMN email_logs.metadata IS 'JSON object containing additional email metadata (template variables, options, etc.)';