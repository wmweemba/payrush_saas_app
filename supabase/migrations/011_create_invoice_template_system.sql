-- Migration: Create Invoice Template & Customization System
-- Date: 2025-10-01
-- Description: Add support for custom invoice templates, branding, numbering schemes, and approval workflows

-- ==============================================================================
-- STEP 1: Invoice Templates Table
-- ==============================================================================

CREATE TABLE IF NOT EXISTS invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_name VARCHAR(100) NOT NULL,
  template_type VARCHAR(50) DEFAULT 'custom',
  is_default BOOLEAN DEFAULT FALSE,
  is_system_template BOOLEAN DEFAULT FALSE,
  
  -- Template Design Configuration (JSON)
  template_data JSONB NOT NULL DEFAULT '{}',
  
  -- Template Metadata
  description TEXT,
  preview_image_url TEXT,
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT unique_user_template_name UNIQUE(user_id, template_name),
  CONSTRAINT template_name_not_empty CHECK (length(trim(template_name)) > 0),
  CONSTRAINT valid_template_type CHECK (template_type IN ('custom', 'professional', 'minimal', 'modern', 'classic'))
);

-- Create partial unique index for default templates (only one default per user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_default_template 
ON invoice_templates(user_id) 
WHERE is_default = TRUE;

-- ==============================================================================
-- STEP 2: Invoice Numbering Schemes Table
-- ==============================================================================

CREATE TABLE IF NOT EXISTS invoice_numbering_schemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheme_name VARCHAR(100) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Numbering Configuration
  prefix VARCHAR(20) DEFAULT '',
  suffix VARCHAR(20) DEFAULT '',
  sequence_length INTEGER DEFAULT 3,
  current_number INTEGER DEFAULT 1,
  reset_frequency VARCHAR(20) DEFAULT 'never', -- never, yearly, monthly, quarterly
  reset_on DATE, -- specific reset date
  
  -- Pattern Examples: INV-2025-001, INVOICE-001, 2025-Q1-001
  pattern_preview VARCHAR(100),
  
  -- Date Formatting in Numbers
  include_year BOOLEAN DEFAULT FALSE,
  include_month BOOLEAN DEFAULT FALSE,
  include_quarter BOOLEAN DEFAULT FALSE,
  date_format VARCHAR(20) DEFAULT 'YYYY', -- YYYY, YY, MM, Q1, etc.
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT unique_user_scheme_name UNIQUE(user_id, scheme_name),
  CONSTRAINT scheme_name_not_empty CHECK (length(trim(scheme_name)) > 0),
  CONSTRAINT valid_reset_frequency CHECK (reset_frequency IN ('never', 'yearly', 'monthly', 'quarterly')),
  CONSTRAINT positive_sequence_length CHECK (sequence_length > 0 AND sequence_length <= 10),
  CONSTRAINT positive_current_number CHECK (current_number > 0)
);

-- Create partial unique index for default numbering schemes (only one default per user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_default_scheme 
ON invoice_numbering_schemes(user_id) 
WHERE is_default = TRUE;

-- ==============================================================================
-- STEP 3: Business Branding Assets Table
-- ==============================================================================

CREATE TABLE IF NOT EXISTS business_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Logo and Images
  logo_url TEXT,
  logo_width INTEGER DEFAULT 150,
  logo_height INTEGER DEFAULT 75,
  favicon_url TEXT,
  watermark_url TEXT,
  
  -- Brand Colors (Hex codes)
  primary_color VARCHAR(7) DEFAULT '#2563eb',
  secondary_color VARCHAR(7) DEFAULT '#64748b',
  accent_color VARCHAR(7) DEFAULT '#f8fafc',
  text_color VARCHAR(7) DEFAULT '#1f2937',
  background_color VARCHAR(7) DEFAULT '#ffffff',
  
  -- Typography
  heading_font VARCHAR(50) DEFAULT 'Helvetica',
  body_font VARCHAR(50) DEFAULT 'Helvetica',
  font_size_multiplier DECIMAL(3, 2) DEFAULT 1.00,
  
  -- Contact Information Override
  display_business_name VARCHAR(200),
  display_address TEXT,
  display_phone VARCHAR(50),
  display_email VARCHAR(100),
  display_website VARCHAR(200),
  
  -- Invoice Footer Content
  footer_text TEXT,
  terms_and_conditions TEXT,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT one_branding_per_user UNIQUE(user_id),
  CONSTRAINT valid_color_format CHECK (
    primary_color ~ '^#[0-9A-Fa-f]{6}$' AND
    secondary_color ~ '^#[0-9A-Fa-f]{6}$' AND
    accent_color ~ '^#[0-9A-Fa-f]{6}$' AND
    text_color ~ '^#[0-9A-Fa-f]{6}$' AND
    background_color ~ '^#[0-9A-Fa-f]{6}$'
  ),
  CONSTRAINT valid_logo_dimensions CHECK (
    (logo_width IS NULL OR logo_width > 0) AND
    (logo_height IS NULL OR logo_height > 0)
  ),
  CONSTRAINT valid_font_multiplier CHECK (font_size_multiplier >= 0.5 AND font_size_multiplier <= 2.0)
);

-- ==============================================================================
-- STEP 4: Invoice Notes and Comments System
-- ==============================================================================

CREATE TABLE IF NOT EXISTS invoice_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Note Content
  note_type VARCHAR(20) DEFAULT 'internal', -- internal, customer_facing, system
  title VARCHAR(200),
  content TEXT NOT NULL,
  
  -- Visibility and Priority
  is_visible_to_customer BOOLEAN DEFAULT FALSE,
  priority VARCHAR(10) DEFAULT 'normal', -- low, normal, high, urgent
  
  -- System/Auto Notes
  is_system_generated BOOLEAN DEFAULT FALSE,
  system_event VARCHAR(50), -- status_change, payment_received, reminder_sent, etc.
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_note_type CHECK (note_type IN ('internal', 'customer_facing', 'system')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  CONSTRAINT content_not_empty CHECK (length(trim(content)) > 0)
);

-- ==============================================================================
-- STEP 5: Invoice Approval Workflow System
-- ==============================================================================

CREATE TABLE IF NOT EXISTS invoice_approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_name VARCHAR(100) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Approval Configuration
  require_approval BOOLEAN DEFAULT TRUE,
  approval_threshold DECIMAL(12, 2), -- Require approval for invoices above this amount
  auto_approve_recurring BOOLEAN DEFAULT FALSE,
  
  -- Approval Routing (JSON for future expansion to multiple approvers)
  approval_routing JSONB DEFAULT '{"approvers": [], "type": "single"}',
  
  -- Approval Settings
  approval_timeout_days INTEGER DEFAULT 7,
  auto_approve_on_timeout BOOLEAN DEFAULT FALSE,
  send_reminder_after_days INTEGER DEFAULT 3,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT unique_user_workflow_name UNIQUE(user_id, workflow_name),
  CONSTRAINT workflow_name_not_empty CHECK (length(trim(workflow_name)) > 0),
  CONSTRAINT positive_threshold CHECK (approval_threshold IS NULL OR approval_threshold >= 0),
  CONSTRAINT valid_timeout_days CHECK (approval_timeout_days > 0 AND approval_timeout_days <= 365),
  CONSTRAINT valid_reminder_days CHECK (send_reminder_after_days > 0 AND send_reminder_after_days < approval_timeout_days)
);

-- Create partial unique index for default workflows (only one default per user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_default_workflow 
ON invoice_approval_workflows(user_id) 
WHERE is_default = TRUE;

-- ==============================================================================
-- STEP 6: Invoice Approval History Table
-- ==============================================================================

CREATE TABLE IF NOT EXISTS invoice_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES invoice_approval_workflows(id) ON DELETE SET NULL,
  
  -- Approval Status
  approval_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, cancelled, expired
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Request Information
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Approval Details
  approval_comments TEXT,
  rejection_reason TEXT,
  
  -- System Fields
  approval_deadline TIMESTAMP WITH TIME ZONE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_approval_status CHECK (approval_status IN ('pending', 'approved', 'rejected', 'cancelled', 'expired')),
  CONSTRAINT approval_logic_check CHECK (
    (approval_status = 'approved' AND approved_by IS NOT NULL AND approved_at IS NOT NULL) OR
    (approval_status != 'approved')
  )
);

-- ==============================================================================
-- STEP 7: Update Invoices Table for Template Integration
-- ==============================================================================

-- Add template and approval fields to invoices table
DO $$ BEGIN
  -- Template Integration
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE invoices ADD COLUMN template_id UUID REFERENCES invoice_templates(id) ON DELETE SET NULL;
  END IF;
  
  -- Numbering Scheme Integration
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'numbering_scheme_id'
  ) THEN
    ALTER TABLE invoices ADD COLUMN numbering_scheme_id UUID REFERENCES invoice_numbering_schemes(id) ON DELETE SET NULL;
  END IF;
  
  -- Custom Invoice Number
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'custom_invoice_number'
  ) THEN
    ALTER TABLE invoices ADD COLUMN custom_invoice_number VARCHAR(100);
  END IF;
  
  -- Approval Integration
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE invoices ADD COLUMN approval_status VARCHAR(20) DEFAULT 'draft';
  END IF;
  
  -- Internal/External Notes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'internal_notes'
  ) THEN
    ALTER TABLE invoices ADD COLUMN internal_notes TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'customer_notes'
  ) THEN
    ALTER TABLE invoices ADD COLUMN customer_notes TEXT;
  END IF;
  
  -- Template/Duplication Support
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'is_template'
  ) THEN
    ALTER TABLE invoices ADD COLUMN is_template BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'template_name'
  ) THEN
    ALTER TABLE invoices ADD COLUMN template_name VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'duplicated_from'
  ) THEN
    ALTER TABLE invoices ADD COLUMN duplicated_from UUID REFERENCES invoices(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add constraints for new invoice fields
DO $$ BEGIN
  -- Approval status constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.table_schema = 'public' 
    AND tc.table_name = 'invoices' 
    AND tc.constraint_type = 'CHECK' 
    AND tc.constraint_name = 'valid_approval_status'
  ) THEN
    ALTER TABLE invoices ADD CONSTRAINT valid_approval_status 
    CHECK (approval_status IN ('draft', 'pending_approval', 'approved', 'rejected', 'sent', 'paid', 'overdue', 'cancelled'));
  END IF;
  
  -- Template name constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.table_schema = 'public' 
    AND tc.table_name = 'invoices' 
    AND tc.constraint_type = 'CHECK' 
    AND tc.constraint_name = 'template_name_when_template'
  ) THEN
    ALTER TABLE invoices ADD CONSTRAINT template_name_when_template 
    CHECK ((is_template = TRUE AND template_name IS NOT NULL) OR (is_template = FALSE));
  END IF;
END $$;

-- ==============================================================================
-- STEP 8: Create Indexes for Performance
-- ==============================================================================

-- Template indexes
CREATE INDEX IF NOT EXISTS idx_invoice_templates_user_id ON invoice_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_templates_is_default ON invoice_templates(user_id, is_default) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_invoice_templates_last_used ON invoice_templates(last_used_at DESC);

-- Numbering scheme indexes
CREATE INDEX IF NOT EXISTS idx_numbering_schemes_user_id ON invoice_numbering_schemes(user_id);
CREATE INDEX IF NOT EXISTS idx_numbering_schemes_is_default ON invoice_numbering_schemes(user_id, is_default) WHERE is_default = TRUE;

-- Branding indexes
CREATE INDEX IF NOT EXISTS idx_business_branding_user_id ON business_branding(user_id);

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_invoice_notes_invoice_id ON invoice_notes(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_notes_type ON invoice_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_invoice_notes_created_at ON invoice_notes(created_at DESC);

-- Approval indexes
CREATE INDEX IF NOT EXISTS idx_invoice_approvals_invoice_id ON invoice_approvals(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_approvals_status ON invoice_approvals(approval_status);
CREATE INDEX IF NOT EXISTS idx_invoice_approvals_requested_at ON invoice_approvals(requested_at DESC);

-- Invoice template integration indexes
CREATE INDEX IF NOT EXISTS idx_invoices_template_id ON invoices(template_id);
CREATE INDEX IF NOT EXISTS idx_invoices_numbering_scheme_id ON invoices(numbering_scheme_id);
CREATE INDEX IF NOT EXISTS idx_invoices_approval_status ON invoices(approval_status);
CREATE INDEX IF NOT EXISTS idx_invoices_is_template ON invoices(is_template) WHERE is_template = TRUE;

-- ==============================================================================
-- STEP 9: Row Level Security (RLS) Policies
-- ==============================================================================

-- Enable RLS on all new tables
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_numbering_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_approvals ENABLE ROW LEVEL SECURITY;

-- Invoice Templates Policies
CREATE POLICY "Users can view their own templates" ON invoice_templates
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own templates" ON invoice_templates
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own templates" ON invoice_templates
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own templates" ON invoice_templates
  FOR DELETE USING (user_id = auth.uid());

-- Numbering Schemes Policies
CREATE POLICY "Users can view their own numbering schemes" ON invoice_numbering_schemes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own numbering schemes" ON invoice_numbering_schemes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own numbering schemes" ON invoice_numbering_schemes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own numbering schemes" ON invoice_numbering_schemes
  FOR DELETE USING (user_id = auth.uid());

-- Business Branding Policies
CREATE POLICY "Users can view their own branding" ON business_branding
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own branding" ON business_branding
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own branding" ON business_branding
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own branding" ON business_branding
  FOR DELETE USING (user_id = auth.uid());

-- Invoice Notes Policies
CREATE POLICY "Users can view notes for their own invoices" ON invoice_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_notes.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create notes for their own invoices" ON invoice_notes
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_notes.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own notes" ON invoice_notes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notes" ON invoice_notes
  FOR DELETE USING (user_id = auth.uid());

-- Approval Workflow Policies
CREATE POLICY "Users can view their own approval workflows" ON invoice_approval_workflows
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own approval workflows" ON invoice_approval_workflows
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own approval workflows" ON invoice_approval_workflows
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own approval workflows" ON invoice_approval_workflows
  FOR DELETE USING (user_id = auth.uid());

-- Invoice Approvals Policies
CREATE POLICY "Users can view approvals for their own invoices" ON invoice_approvals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_approvals.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create approvals for their own invoices" ON invoice_approvals
  FOR INSERT WITH CHECK (
    requested_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_approvals.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update approvals for their own invoices" ON invoice_approvals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_approvals.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

-- ==============================================================================
-- STEP 10: Utility Functions
-- ==============================================================================

-- Function to generate next invoice number
CREATE OR REPLACE FUNCTION generate_next_invoice_number(scheme_id UUID)
RETURNS VARCHAR(100) AS $$
DECLARE
  scheme RECORD;
  next_number INTEGER;
  formatted_number VARCHAR(20);
  date_part VARCHAR(20) := '';
  result VARCHAR(100);
BEGIN
  -- Get the numbering scheme
  SELECT * INTO scheme FROM invoice_numbering_schemes WHERE id = scheme_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Numbering scheme not found';
  END IF;
  
  -- Get next number and increment
  next_number := scheme.current_number;
  
  -- Format the number with leading zeros
  formatted_number := LPAD(next_number::TEXT, scheme.sequence_length, '0');
  
  -- Add date components if specified
  IF scheme.include_year THEN
    CASE scheme.date_format
      WHEN 'YYYY' THEN date_part := date_part || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
      WHEN 'YY' THEN date_part := date_part || RIGHT(EXTRACT(YEAR FROM CURRENT_DATE)::TEXT, 2);
    END CASE;
    date_part := date_part || '-';
  END IF;
  
  IF scheme.include_quarter THEN
    date_part := date_part || 'Q' || EXTRACT(QUARTER FROM CURRENT_DATE)::TEXT || '-';
  END IF;
  
  IF scheme.include_month THEN
    date_part := date_part || LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::TEXT, 2, '0') || '-';
  END IF;
  
  -- Remove trailing dash
  date_part := RTRIM(date_part, '-');
  
  -- Construct final number
  result := scheme.prefix;
  IF LENGTH(date_part) > 0 THEN
    result := result || CASE WHEN LENGTH(result) > 0 THEN '-' ELSE '' END || date_part;
  END IF;
  result := result || CASE WHEN LENGTH(result) > 0 THEN '-' ELSE '' END || formatted_number;
  result := result || scheme.suffix;
  
  -- Update the scheme's current number
  UPDATE invoice_numbering_schemes 
  SET current_number = current_number + 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = scheme_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to create default templates for new users
CREATE OR REPLACE FUNCTION create_default_user_templates(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Create default Professional template
  INSERT INTO invoice_templates (user_id, template_name, template_type, is_default, is_system_template, template_data)
  VALUES (
    user_uuid,
    'Default Professional',
    'professional',
    TRUE,
    TRUE,
    '{
      "colors": {
        "primary": "#2563eb",
        "secondary": "#64748b",
        "text": "#1f2937",
        "accent": "#f8fafc"
      },
      "fonts": {
        "heading": {"size": 24, "weight": "bold"},
        "subheading": {"size": 12, "weight": "bold"},
        "body": {"size": 10, "weight": "normal"},
        "small": {"size": 8, "weight": "normal"}
      },
      "layout": {
        "headerHeight": 40,
        "marginX": 20,
        "marginY": 20
      }
    }'
  );
  
  -- Create default numbering scheme
  INSERT INTO invoice_numbering_schemes (user_id, scheme_name, is_default, prefix, current_number, pattern_preview)
  VALUES (
    user_uuid,
    'Default Numbering',
    TRUE,
    'INV',
    1,
    'INV-001'
  );
  
  -- Create default branding entry
  INSERT INTO business_branding (user_id)
  VALUES (user_uuid);
  
  -- Create default approval workflow
  INSERT INTO invoice_approval_workflows (user_id, workflow_name, is_default, require_approval)
  VALUES (
    user_uuid,
    'Default Approval',
    TRUE,
    FALSE -- No approval required by default
  );
END;
$$ LANGUAGE plpgsql;

-- Function to update template usage statistics
CREATE OR REPLACE FUNCTION update_template_usage(template_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE invoice_templates 
  SET usage_count = usage_count + 1,
      last_used_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = template_uuid;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- STEP 11: Triggers for Automatic Timestamp Updates
-- ==============================================================================

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
DROP TRIGGER IF EXISTS trigger_update_invoice_templates_updated_at ON invoice_templates;
CREATE TRIGGER trigger_update_invoice_templates_updated_at
  BEFORE UPDATE ON invoice_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_numbering_schemes_updated_at ON invoice_numbering_schemes;
CREATE TRIGGER trigger_update_numbering_schemes_updated_at
  BEFORE UPDATE ON invoice_numbering_schemes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_business_branding_updated_at ON business_branding;
CREATE TRIGGER trigger_update_business_branding_updated_at
  BEFORE UPDATE ON business_branding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_invoice_notes_updated_at ON invoice_notes;
CREATE TRIGGER trigger_update_invoice_notes_updated_at
  BEFORE UPDATE ON invoice_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_approval_workflows_updated_at ON invoice_approval_workflows;
CREATE TRIGGER trigger_update_approval_workflows_updated_at
  BEFORE UPDATE ON invoice_approval_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_invoice_approvals_updated_at ON invoice_approvals;
CREATE TRIGGER trigger_update_invoice_approvals_updated_at
  BEFORE UPDATE ON invoice_approvals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- STEP 12: Create Views for Easy Data Access
-- ==============================================================================

-- Invoice with template and approval information
CREATE OR REPLACE VIEW invoice_details_extended AS
SELECT 
  i.*,
  it.template_name,
  it.template_type,
  ins.scheme_name as numbering_scheme_name,
  ins.pattern_preview as number_pattern,
  bb.primary_color as brand_primary_color,
  bb.logo_url as brand_logo_url,
  bb.display_business_name as brand_business_name,
  ia.approval_status as current_approval_status,
  ia.approved_by,
  ia.approved_at,
  ia.requested_at as approval_requested_at,
  (SELECT COUNT(*) FROM invoice_notes WHERE invoice_id = i.id) as notes_count,
  (SELECT COUNT(*) FROM invoice_notes WHERE invoice_id = i.id AND is_visible_to_customer = TRUE) as customer_notes_count
FROM invoices i
LEFT JOIN invoice_templates it ON i.template_id = it.id
LEFT JOIN invoice_numbering_schemes ins ON i.numbering_scheme_id = ins.id
LEFT JOIN business_branding bb ON i.user_id = bb.user_id
LEFT JOIN invoice_approvals ia ON i.id = ia.invoice_id AND ia.approval_status = 'pending';

-- Template usage statistics
CREATE OR REPLACE VIEW template_usage_stats AS
SELECT 
  it.*,
  (SELECT COUNT(*) FROM invoices WHERE template_id = it.id) as total_invoices_created,
  (SELECT COUNT(*) FROM invoices WHERE template_id = it.id AND created_at >= CURRENT_DATE - INTERVAL '30 days') as invoices_last_30_days,
  (SELECT COUNT(*) FROM invoices WHERE template_id = it.id AND created_at >= CURRENT_DATE - INTERVAL '7 days') as invoices_last_7_days
FROM invoice_templates it;

-- ==============================================================================
-- STEP 13: Sample Data for Testing (Optional)
-- ==============================================================================

-- Insert sample system templates (commented out for production)
/*
INSERT INTO invoice_templates (user_id, template_name, template_type, is_system_template, template_data, description) VALUES
((SELECT id FROM auth.users LIMIT 1), 'System Professional', 'professional', TRUE, 
 '{"colors": {"primary": "#2563eb", "secondary": "#64748b"}, "fonts": {"heading": {"size": 24}}}',
 'Professional template with blue color scheme'),
((SELECT id FROM auth.users LIMIT 1), 'System Minimal', 'minimal', TRUE,
 '{"colors": {"primary": "#000000", "secondary": "#666666"}, "fonts": {"heading": {"size": 20}}}',
 'Clean minimal template with black and white design'),
((SELECT id FROM auth.users LIMIT 1), 'System Modern', 'modern', TRUE,
 '{"colors": {"primary": "#7c3aed", "secondary": "#a855f7"}, "fonts": {"heading": {"size": 22}}}',
 'Modern template with purple gradient design'),
((SELECT id FROM auth.users LIMIT 1), 'System Classic', 'classic', TRUE,
 '{"colors": {"primary": "#1f2937", "secondary": "#4b5563"}, "fonts": {"heading": {"size": 22}}}',
 'Traditional classic template with professional borders');
*/

-- ==============================================================================
-- VERIFICATION & COMPLETION
-- ==============================================================================

-- Display migration success message
SELECT 'Invoice Template & Customization System migration completed successfully!' as status;

-- Show created tables
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN (
    'invoice_templates', 
    'invoice_numbering_schemes', 
    'business_branding', 
    'invoice_notes', 
    'invoice_approval_workflows', 
    'invoice_approvals'
  )
ORDER BY table_name;

-- Show invoice table extensions
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'invoices' 
  AND column_name IN (
    'template_id', 
    'numbering_scheme_id', 
    'custom_invoice_number', 
    'approval_status', 
    'internal_notes', 
    'customer_notes', 
    'is_template', 
    'template_name', 
    'duplicated_from'
  )
ORDER BY column_name;