-- Migration: Create clients table for customer relationship management
-- Date: 2025-09-26
-- Description: Add comprehensive client management system with contact info, preferences, and analytics

-- Step 1: Create clients table with comprehensive schema
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Basic Information
  name text NOT NULL,
  email text,
  phone text,
  company text,
  
  -- Address Information
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text,
  
  -- Client Preferences
  default_currency VARCHAR(3) DEFAULT 'USD',
  preferred_payment_method text,
  payment_terms_days integer DEFAULT 30,
  
  -- Client Status and Classification
  status text CHECK (status IN ('active', 'inactive', 'blocked')) DEFAULT 'active',
  client_type text CHECK (client_type IN ('individual', 'business', 'organization')) DEFAULT 'individual',
  
  -- Financial Information
  credit_limit numeric(12,2) DEFAULT 0,
  current_balance numeric(12,2) DEFAULT 0,
  total_invoiced numeric(12,2) DEFAULT 0,
  total_paid numeric(12,2) DEFAULT 0,
  
  -- Communication Preferences
  email_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT false,
  whatsapp_notifications boolean DEFAULT false,
  
  -- Additional Information
  notes text,
  tags text[], -- Array of tags for categorization
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_invoice_date timestamptz,
  last_payment_date timestamptz,
  
  -- Constraints
  CONSTRAINT clients_email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL),
  CONSTRAINT clients_phone_not_empty CHECK (phone IS NULL OR length(trim(phone)) > 0),
  CONSTRAINT clients_default_currency_check CHECK (default_currency IN ('USD', 'ZMW', 'EUR', 'GBP', 'NGN', 'KES', 'GHS', 'ZAR')),
  CONSTRAINT clients_credit_limit_positive CHECK (credit_limit >= 0),
  CONSTRAINT clients_payment_terms_positive CHECK (payment_terms_days > 0)
);

-- Step 2: Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_client_type ON clients(client_type);
CREATE INDEX IF NOT EXISTS idx_clients_default_currency ON clients(default_currency);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);
CREATE INDEX IF NOT EXISTS idx_clients_name_search ON clients USING gin(to_tsvector('english', name || ' ' || coalesce(company, '')));

-- Step 3: Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for clients table
-- Policy for users to see only their own clients
CREATE POLICY "Users can view own clients" ON clients
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own clients
CREATE POLICY "Users can insert own clients" ON clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own clients
CREATE POLICY "Users can update own clients" ON clients
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own clients
CREATE POLICY "Users can delete own clients" ON clients
  FOR DELETE USING (auth.uid() = user_id);

-- Step 5: Create function to update client updated_at timestamp
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger for automatic updated_at updates
DROP TRIGGER IF EXISTS clients_updated_at_trigger ON clients;
CREATE TRIGGER clients_updated_at_trigger
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_at();

-- Step 7: Create function to update client financial statistics
CREATE OR REPLACE FUNCTION update_client_financials(client_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE clients SET
    total_invoiced = COALESCE((
      SELECT SUM(amount) 
      FROM invoices 
      WHERE client_id = clients.id
    ), 0),
    total_paid = COALESCE((
      SELECT SUM(p.amount)
      FROM invoices i
      JOIN payments p ON i.id = p.invoice_id
      WHERE i.client_id = clients.id AND p.status = 'completed'
    ), 0),
    current_balance = COALESCE((
      SELECT SUM(
        CASE 
          WHEN i.status IN ('draft', 'sent', 'overdue') THEN i.amount
          ELSE 0
        END
      )
      FROM invoices i
      WHERE i.client_id = clients.id
    ), 0),
    last_invoice_date = (
      SELECT MAX(created_at)
      FROM invoices
      WHERE client_id = clients.id
    ),
    last_payment_date = (
      SELECT MAX(p.created_at)
      FROM invoices i
      JOIN payments p ON i.id = p.invoice_id
      WHERE i.client_id = clients.id AND p.status = 'completed'
    )
  WHERE id = client_id;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Add client_id column to invoices table if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' 
    AND column_name = 'client_id'
  ) THEN
    ALTER TABLE invoices ADD COLUMN client_id uuid REFERENCES clients(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
  END IF;
END $$;

-- Step 9: Create view for client summary statistics
CREATE OR REPLACE VIEW client_summary AS
SELECT 
  c.*,
  COALESCE(invoice_stats.invoice_count, 0) as invoice_count,
  COALESCE(invoice_stats.pending_invoices, 0) as pending_invoices,
  COALESCE(invoice_stats.overdue_invoices, 0) as overdue_invoices,
  COALESCE(payment_stats.payment_count, 0) as payment_count,
  CASE 
    WHEN c.total_invoiced > 0 THEN (c.total_paid / c.total_invoiced * 100)
    ELSE 0 
  END as payment_rate_percentage,
  CASE
    WHEN c.last_invoice_date IS NULL THEN 'never'
    WHEN c.last_invoice_date > now() - interval '30 days' THEN 'recent'
    WHEN c.last_invoice_date > now() - interval '90 days' THEN 'moderate'
    ELSE 'inactive'
  END as activity_status
FROM clients c
LEFT JOIN (
  SELECT 
    client_id,
    COUNT(*) as invoice_count,
    COUNT(CASE WHEN status IN ('draft', 'sent') THEN 1 END) as pending_invoices,
    COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_invoices
  FROM invoices 
  WHERE client_id IS NOT NULL
  GROUP BY client_id
) invoice_stats ON c.id = invoice_stats.client_id
LEFT JOIN (
  SELECT 
    i.client_id,
    COUNT(p.*) as payment_count
  FROM invoices i
  JOIN payments p ON i.id = p.invoice_id
  WHERE i.client_id IS NOT NULL AND p.status = 'completed'
  GROUP BY i.client_id
) payment_stats ON c.id = payment_stats.client_id;

-- Step 10: Create function to search clients
CREATE OR REPLACE FUNCTION search_clients(
  search_user_id uuid,
  search_term text DEFAULT '',
  client_status text DEFAULT 'all',
  client_type_filter text DEFAULT 'all',
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  phone text,
  company text,
  status text,
  client_type text,
  total_invoiced numeric,
  total_paid numeric,
  current_balance numeric,
  invoice_count bigint,
  activity_status text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.id,
    cs.name,
    cs.email,
    cs.phone,
    cs.company,
    cs.status,
    cs.client_type,
    cs.total_invoiced,
    cs.total_paid,
    cs.current_balance,
    cs.invoice_count,
    cs.activity_status,
    cs.created_at
  FROM client_summary cs
  WHERE cs.user_id = search_user_id
    AND (search_term = '' OR 
         cs.name ILIKE '%' || search_term || '%' OR
         cs.email ILIKE '%' || search_term || '%' OR
         cs.company ILIKE '%' || search_term || '%')
    AND (client_status = 'all' OR cs.status = client_status)
    AND (client_type_filter = 'all' OR cs.client_type = client_type_filter)
  ORDER BY cs.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Insert sample clients for testing (optional - remove in production)
-- This will only insert if there are no existing clients
DO $$ 
DECLARE 
  sample_user_id uuid;
BEGIN
  -- Get a sample user ID (first profile)
  SELECT id INTO sample_user_id FROM profiles LIMIT 1;
  
  IF sample_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM clients LIMIT 1) THEN
    INSERT INTO clients (user_id, name, email, phone, company, client_type, default_currency, notes) VALUES
    (sample_user_id, 'John Doe', 'john.doe@example.com', '+1234567890', 'Acme Corp', 'business', 'USD', 'Primary contact for Acme Corp'),
    (sample_user_id, 'Jane Smith', 'jane.smith@example.com', '+1234567891', NULL, 'individual', 'EUR', 'Freelance consultant'),
    (sample_user_id, 'Michael Johnson', 'michael@techstart.zm', '+260-XXX-XXXX', 'TechStart Zambia', 'business', 'ZMW', 'Tech startup in Lusaka');
  END IF;
END $$;

-- Verification and information queries
SELECT 'Client management system created successfully' as status;

-- Display table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;