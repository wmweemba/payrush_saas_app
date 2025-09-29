-- Migration: Enhance Client Contact Information Management
-- Date: 2025-09-29
-- Description: Add support for multiple contact methods, contact persons, and enhanced address management

-- Step 1: Create client_contacts table for multiple contact persons
CREATE TABLE IF NOT EXISTS client_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Contact Person Information
  first_name text NOT NULL,
  last_name text NOT NULL,
  job_title text,
  department text,
  
  -- Contact Methods
  primary_email text,
  secondary_email text,
  primary_phone text,
  secondary_phone text,
  mobile_phone text,
  whatsapp_number text,
  
  -- Contact Preferences
  is_primary_contact boolean DEFAULT false,
  is_billing_contact boolean DEFAULT false,
  is_technical_contact boolean DEFAULT false,
  
  -- Communication Preferences
  preferred_contact_method text CHECK (preferred_contact_method IN ('email', 'phone', 'sms', 'whatsapp')) DEFAULT 'email',
  email_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT false,
  whatsapp_notifications boolean DEFAULT false,
  
  -- Additional Information
  notes text,
  date_of_birth date, -- For personal relationships
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT contact_email_format CHECK (
    (primary_email IS NULL OR primary_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') AND
    (secondary_email IS NULL OR secondary_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
  ),
  CONSTRAINT contact_name_not_empty CHECK (
    length(trim(first_name)) > 0 AND length(trim(last_name)) > 0
  )
);

-- Step 2: Create client_addresses table for multiple addresses (billing, shipping, etc.)
CREATE TABLE IF NOT EXISTS client_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Address Type and Label
  address_type text CHECK (address_type IN ('billing', 'shipping', 'office', 'home', 'other')) NOT NULL,
  address_label text, -- Custom label like "Main Office", "Warehouse", etc.
  
  -- Address Information
  address_line1 text NOT NULL,
  address_line2 text,
  address_line3 text, -- Additional address line for complex addresses
  city text NOT NULL,
  state_province text,
  postal_code text,
  country text NOT NULL DEFAULT 'Zambia',
  
  -- Address Preferences
  is_default boolean DEFAULT false,
  is_billing_address boolean DEFAULT false,
  is_shipping_address boolean DEFAULT false,
  
  -- Additional Information
  delivery_instructions text,
  landmark text, -- Helpful for local deliveries
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT address_line1_not_empty CHECK (length(trim(address_line1)) > 0),
  CONSTRAINT city_not_empty CHECK (length(trim(city)) > 0),
  CONSTRAINT country_not_empty CHECK (length(trim(country)) > 0)
);

-- Step 3: Add new columns to clients table for enhanced contact management
ALTER TABLE clients ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS linkedin_profile text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_size text CHECK (company_size IN ('1-10', '11-50', '51-200', '201-1000', '1000+'));
ALTER TABLE clients ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Africa/Lusaka';

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_contacts_client_id ON client_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_contacts_primary_email ON client_contacts(primary_email) WHERE primary_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_client_contacts_primary_contact ON client_contacts(client_id, is_primary_contact) WHERE is_primary_contact = true;

CREATE INDEX IF NOT EXISTS idx_client_addresses_client_id ON client_addresses(client_id);
CREATE INDEX IF NOT EXISTS idx_client_addresses_type ON client_addresses(client_id, address_type);
CREATE INDEX IF NOT EXISTS idx_client_addresses_default ON client_addresses(client_id, is_default) WHERE is_default = true;

-- Step 5: Enable Row Level Security
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_addresses ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for client_contacts
CREATE POLICY "Users can view contacts of own clients" ON client_contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = client_contacts.client_id 
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert contacts for own clients" ON client_contacts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = client_contacts.client_id 
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update contacts of own clients" ON client_contacts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = client_contacts.client_id 
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete contacts of own clients" ON client_contacts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = client_contacts.client_id 
      AND clients.user_id = auth.uid()
    )
  );

-- Step 7: Create RLS policies for client_addresses
CREATE POLICY "Users can view addresses of own clients" ON client_addresses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = client_addresses.client_id 
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert addresses for own clients" ON client_addresses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = client_addresses.client_id 
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update addresses of own clients" ON client_addresses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = client_addresses.client_id 
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete addresses of own clients" ON client_addresses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = client_addresses.client_id 
      AND clients.user_id = auth.uid()
    )
  );

-- Step 8: Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_client_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_client_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_contacts_updated_at_trigger
  BEFORE UPDATE ON client_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_client_contacts_updated_at();

CREATE TRIGGER client_addresses_updated_at_trigger
  BEFORE UPDATE ON client_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_client_addresses_updated_at();

-- Step 9: Create function to ensure only one primary contact per client
CREATE OR REPLACE FUNCTION ensure_single_primary_contact()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a contact as primary, remove primary status from others for this client
  IF NEW.is_primary_contact = true THEN
    UPDATE client_contacts 
    SET is_primary_contact = false 
    WHERE client_id = NEW.client_id 
    AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_primary_contact_trigger
  AFTER INSERT OR UPDATE ON client_contacts
  FOR EACH ROW
  WHEN (NEW.is_primary_contact = true)
  EXECUTE FUNCTION ensure_single_primary_contact();

-- Step 10: Create function to ensure only one default address per client per type
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting an address as default, remove default status from others for this client and type
  IF NEW.is_default = true THEN
    UPDATE client_addresses 
    SET is_default = false 
    WHERE client_id = NEW.client_id 
    AND address_type = NEW.address_type 
    AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_address_trigger
  AFTER INSERT OR UPDATE ON client_addresses
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_address();

-- Step 11: Create views for easier data access
CREATE OR REPLACE VIEW client_with_primary_contact AS
SELECT 
  c.*,
  cc.first_name as primary_contact_first_name,
  cc.last_name as primary_contact_last_name,
  cc.job_title as primary_contact_title,
  cc.primary_email as primary_contact_email,
  cc.primary_phone as primary_contact_phone,
  cc.preferred_contact_method
FROM clients c
LEFT JOIN client_contacts cc ON c.id = cc.client_id AND cc.is_primary_contact = true;

CREATE OR REPLACE VIEW client_with_billing_address AS
SELECT 
  c.*,
  ca.address_line1 as billing_address_line1,
  ca.address_line2 as billing_address_line2,
  ca.city as billing_city,
  ca.state_province as billing_state,
  ca.postal_code as billing_postal_code,
  ca.country as billing_country
FROM clients c
LEFT JOIN client_addresses ca ON c.id = ca.client_id 
  AND (ca.is_billing_address = true OR (ca.address_type = 'billing' AND ca.is_default = true));

-- Step 12: Insert sample data for existing clients
DO $$ 
DECLARE 
  client_record RECORD;
BEGIN
  -- Add sample contacts and addresses for existing clients
  FOR client_record IN SELECT id, name, email, phone FROM clients LIMIT 5 LOOP
    -- Add primary contact if client has basic info
    IF client_record.email IS NOT NULL THEN
      INSERT INTO client_contacts (
        client_id, 
        first_name, 
        last_name, 
        primary_email, 
        primary_phone,
        is_primary_contact,
        job_title
      ) VALUES (
        client_record.id,
        split_part(client_record.name, ' ', 1),
        COALESCE(split_part(client_record.name, ' ', 2), ''),
        client_record.email,
        client_record.phone,
        true,
        'Primary Contact'
      ) ON CONFLICT DO NOTHING;
    END IF;
    
    -- Add default billing address using existing client address info
    INSERT INTO client_addresses (
      client_id,
      address_type,
      address_label,
      address_line1,
      city,
      country,
      is_default,
      is_billing_address
    ) VALUES (
      client_record.id,
      'billing',
      'Main Office',
      COALESCE((SELECT address_line1 FROM clients WHERE id = client_record.id), 'No address provided'),
      COALESCE((SELECT city FROM clients WHERE id = client_record.id), 'Lusaka'),
      COALESCE((SELECT country FROM clients WHERE id = client_record.id), 'Zambia'),
      true,
      true
    ) ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Verification queries
SELECT 'Enhanced client contact management system created successfully' as status;

-- Display new table structures
SELECT 'CLIENT_CONTACTS TABLE STRUCTURE:' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'client_contacts' 
ORDER BY ordinal_position;

SELECT 'CLIENT_ADDRESSES TABLE STRUCTURE:' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'client_addresses' 
ORDER BY ordinal_position;