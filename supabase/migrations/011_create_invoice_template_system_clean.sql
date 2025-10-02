-- Migration: Create Invoice Template & Customization System (Clean Version)
-- Date: 2025-10-01
-- Description: Add support for custom invoice templates, branding, numbering schemes, and approval workflows

-- ==============================================================================
-- STEP 1: Invoice Templates Table
-- ==============================================================================

CREATE TABLE IF NOT EXISTS invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Allow NULL for system templates
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
  CONSTRAINT valid_template_type CHECK (template_type IN ('custom', 'professional', 'minimal', 'modern', 'classic')),
  CONSTRAINT system_template_user_id CHECK (
    (is_system_template = TRUE AND user_id IS NULL) OR 
    (is_system_template = FALSE AND user_id IS NOT NULL)
  )
);

-- Create partial unique index for default templates (only one default per user)
-- Note: System templates (user_id IS NULL) don't have defaults, so this only applies to user templates
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_default_template 
ON invoice_templates(user_id) 
WHERE is_default = TRUE AND user_id IS NOT NULL;

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
  
  -- Advanced Options
  reset_frequency VARCHAR(20) DEFAULT 'never', -- never, yearly, monthly, quarterly
  last_reset_date DATE,
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
  logo_width INTEGER,
  logo_height INTEGER,
  
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
-- STEP 4: Invoice Notes Table
-- ==============================================================================

CREATE TABLE IF NOT EXISTS invoice_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Note Content
  note_text TEXT NOT NULL,
  note_type VARCHAR(20) DEFAULT 'internal', -- internal, customer, system
  priority VARCHAR(10) DEFAULT 'normal', -- low, normal, high, urgent
  
  -- Visibility and Status
  is_visible_to_customer BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_resolved BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_by_name VARCHAR(100),
  updated_by_name VARCHAR(100),
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT note_text_not_empty CHECK (length(trim(note_text)) > 0),
  CONSTRAINT valid_note_type CHECK (note_type IN ('internal', 'customer', 'system')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

-- ==============================================================================
-- STEP 5: Invoice Approval Workflows Table
-- ==============================================================================

CREATE TABLE IF NOT EXISTS invoice_approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Approval Configuration
  approval_steps JSONB NOT NULL DEFAULT '[]', -- Array of step configurations
  require_all_approvers BOOLEAN DEFAULT FALSE,
  auto_approve_threshold DECIMAL(15, 2), -- Auto-approve if invoice amount is below this
  
  -- Workflow Settings
  approval_timeout_days INTEGER DEFAULT 7,
  send_reminder_after_days INTEGER DEFAULT 3,
  escalation_enabled BOOLEAN DEFAULT FALSE,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT unique_user_workflow_name UNIQUE(user_id, workflow_name),
  CONSTRAINT workflow_name_not_empty CHECK (length(trim(workflow_name)) > 0),
  CONSTRAINT positive_threshold CHECK (auto_approve_threshold IS NULL OR auto_approve_threshold >= 0),
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
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  current_step INTEGER DEFAULT 0,
  
  -- Approval Details
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional Data
  notes TEXT,
  approval_data JSONB DEFAULT '{}', -- Store workflow progress, history, etc.
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_approval_status CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT positive_current_step CHECK (current_step >= 0)
);

-- ==============================================================================
-- STEP 7: Safely Add Columns to Invoices Table (No Duplicates)
-- ==============================================================================

-- Function to safely add columns only if they don't exist
DO $$ 
DECLARE
    column_exists boolean;
BEGIN
    -- Check and add template_id
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'template_id'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE invoices ADD COLUMN template_id UUID REFERENCES invoice_templates(id) ON DELETE SET NULL;
    END IF;
    
    -- Check and add numbering_scheme_id
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'numbering_scheme_id'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE invoices ADD COLUMN numbering_scheme_id UUID REFERENCES invoice_numbering_schemes(id) ON DELETE SET NULL;
    END IF;
    
    -- Check and add custom_invoice_number
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'custom_invoice_number'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE invoices ADD COLUMN custom_invoice_number VARCHAR(100);
    END IF;
    
    -- Check and add approval_status
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'approval_status'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE invoices ADD COLUMN approval_status VARCHAR(20) DEFAULT 'draft';
    END IF;
    
    -- Check and add internal_notes
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'internal_notes'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE invoices ADD COLUMN internal_notes TEXT;
    END IF;
    
    -- Check and add customer_notes
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'customer_notes'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE invoices ADD COLUMN customer_notes TEXT;
    END IF;
    
    -- Check and add is_template
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'is_template'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE invoices ADD COLUMN is_template BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Check and add template_name (this was causing the duplicate error)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'template_name'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE invoices ADD COLUMN template_name VARCHAR(100);
    END IF;
    
    -- Check and add duplicated_from
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'duplicated_from'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE invoices ADD COLUMN duplicated_from UUID REFERENCES invoices(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ==============================================================================
-- STEP 8: Add Constraints Safely
-- ==============================================================================

DO $$ 
DECLARE
    constraint_exists boolean;
BEGIN
    -- Check and add approval_status constraint
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' AND table_name = 'invoices' AND constraint_name = 'valid_approval_status'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        ALTER TABLE invoices ADD CONSTRAINT valid_approval_status 
        CHECK (approval_status IN ('draft', 'pending_approval', 'approved', 'rejected', 'sent', 'paid', 'overdue', 'cancelled'));
    END IF;
    
    -- Check and add template_name constraint
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' AND table_name = 'invoices' AND constraint_name = 'template_name_when_template'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        ALTER TABLE invoices ADD CONSTRAINT template_name_when_template 
        CHECK ((is_template = TRUE AND template_name IS NOT NULL) OR (is_template = FALSE));
    END IF;
END $$;

-- ==============================================================================
-- STEP 9: Create Indexes for Performance
-- ==============================================================================

-- Template indexes
CREATE INDEX IF NOT EXISTS idx_invoice_templates_user_id ON invoice_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_templates_last_used ON invoice_templates(last_used_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoice_templates_system ON invoice_templates(is_system_template) WHERE is_system_template = TRUE;

-- Numbering scheme indexes
CREATE INDEX IF NOT EXISTS idx_numbering_schemes_user_id ON invoice_numbering_schemes(user_id);

-- Branding indexes
CREATE INDEX IF NOT EXISTS idx_business_branding_user_id ON business_branding(user_id);

-- Notes indexes
CREATE INDEX IF NOT EXISTS idx_invoice_notes_invoice_id ON invoice_notes(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_notes_user_id ON invoice_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_notes_visibility ON invoice_notes(is_visible_to_customer);

-- Approval indexes
CREATE INDEX IF NOT EXISTS idx_invoice_approvals_invoice_id ON invoice_approvals(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_approvals_status ON invoice_approvals(status);
CREATE INDEX IF NOT EXISTS idx_invoice_approvals_submitted_by ON invoice_approvals(submitted_by);

-- Invoice template integration indexes
CREATE INDEX IF NOT EXISTS idx_invoices_template_id ON invoices(template_id);
CREATE INDEX IF NOT EXISTS idx_invoices_numbering_scheme ON invoices(numbering_scheme_id);
CREATE INDEX IF NOT EXISTS idx_invoices_approval_status ON invoices(approval_status);
CREATE INDEX IF NOT EXISTS idx_invoices_is_template ON invoices(is_template) WHERE is_template = TRUE;

-- ==============================================================================
-- STEP 10: Enable Row Level Security (RLS)
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_numbering_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_approvals ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- STEP 11: Create RLS Policies
-- ==============================================================================

-- Invoice Templates Policies
CREATE POLICY "Users can manage their own templates" ON invoice_templates
FOR ALL TO authenticated
USING (user_id = auth.uid() AND is_system_template = FALSE)
WITH CHECK (user_id = auth.uid() AND is_system_template = FALSE);

CREATE POLICY "Users can view system templates" ON invoice_templates
FOR SELECT TO authenticated
USING (is_system_template = TRUE AND user_id IS NULL);

-- Numbering Schemes Policies
CREATE POLICY "Users can manage their own numbering schemes" ON invoice_numbering_schemes
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Business Branding Policies
CREATE POLICY "Users can manage their own branding" ON business_branding
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Invoice Notes Policies
CREATE POLICY "Users can manage notes on their invoices" ON invoice_notes
FOR ALL TO authenticated
USING (
  user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_notes.invoice_id AND invoices.user_id = auth.uid())
)
WITH CHECK (
  user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_notes.invoice_id AND invoices.user_id = auth.uid())
);

-- Approval Workflows Policies
CREATE POLICY "Users can manage their own workflows" ON invoice_approval_workflows
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Invoice Approvals Policies
CREATE POLICY "Users can view approvals for their invoices" ON invoice_approvals
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_approvals.invoice_id AND invoices.user_id = auth.uid())
);

CREATE POLICY "Users can create approvals for their invoices" ON invoice_approvals
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_approvals.invoice_id AND invoices.user_id = auth.uid())
);

CREATE POLICY "Users can update approvals they submitted or are approvers for" ON invoice_approvals
FOR UPDATE TO authenticated
USING (
  submitted_by = auth.uid() OR
  EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_approvals.invoice_id AND invoices.user_id = auth.uid())
);

-- ==============================================================================
-- STEP 12: Insert Default System Templates (Fixed)
-- ==============================================================================

-- First, create a system user if it doesn't exist (or use a different approach)
-- We'll create system templates without a specific user_id by using a different approach

-- Create system templates function that will be called after users are created
CREATE OR REPLACE FUNCTION create_system_templates()
RETURNS void AS $$
BEGIN
  -- Only create system templates if none exist
  IF NOT EXISTS (SELECT 1 FROM invoice_templates WHERE is_system_template = TRUE LIMIT 1) THEN
    
    -- Professional Template (we'll set user_id to NULL and handle it in RLS)
    INSERT INTO invoice_templates (user_id, template_name, template_type, is_system_template, template_data, description)
    VALUES (
      NULL, -- We'll use NULL for system templates and handle in RLS
      'Professional',
      'professional',
      TRUE,
      '{
        "layout": "standard",
        "colors": {
          "primary": "#2563eb",
          "secondary": "#64748b",
          "accent": "#f8fafc"
        },
        "fonts": {
          "heading": "Arial",
          "body": "Arial"
        },
        "header": {
          "show_logo": true,
          "logo_position": "left",
          "show_business_info": true
        },
        "footer": {
          "show_page_numbers": true,
          "show_terms": true
        },
        "styling": {
          "border_style": "solid",
          "border_width": 1,
          "border_radius": 4
        }
      }',
      'Clean, professional template suitable for most businesses'
    );

    -- Modern Template
    INSERT INTO invoice_templates (user_id, template_name, template_type, is_system_template, template_data, description)
    VALUES (
      NULL,
      'Modern',
      'modern',
      TRUE,
      '{
        "layout": "modern",
        "colors": {
          "primary": "#6366f1",
          "secondary": "#8b5cf6",
          "accent": "#f0f9ff"
        },
        "fonts": {
          "heading": "Inter",
          "body": "Inter"
        },
        "header": {
          "show_logo": true,
          "logo_position": "center",
          "show_business_info": true,
          "header_style": "gradient"
        },
        "footer": {
          "show_page_numbers": false,
          "show_terms": true,
          "footer_style": "minimal"
        },
        "styling": {
          "border_style": "none",
          "border_radius": 8,
          "shadow": true
        }
      }',
      'Contemporary design with gradients and modern typography'
    );

    -- Minimal Template
    INSERT INTO invoice_templates (user_id, template_name, template_type, is_system_template, template_data, description)
    VALUES (
      NULL,
      'Minimal',
      'minimal',
      TRUE,
      '{
        "layout": "minimal",
        "colors": {
          "primary": "#000000",
          "secondary": "#6b7280",
          "accent": "#ffffff"
        },
        "fonts": {
          "heading": "Helvetica",
          "body": "Helvetica"
        },
        "header": {
          "show_logo": false,
          "show_business_info": true,
          "header_style": "text_only"
        },
        "footer": {
          "show_page_numbers": false,
          "show_terms": false
        },
        "styling": {
          "border_style": "none",
          "border_radius": 0,
          "minimal_spacing": true
        }
      }',
      'Clean, minimal design focusing on content'
    );

    RAISE NOTICE 'System templates created successfully';
  ELSE
    RAISE NOTICE 'System templates already exist, skipping creation';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- STEP 13: Create System Templates
-- ==============================================================================

-- Call the function to create system templates
SELECT create_system_templates();

-- ==============================================================================
-- STEP 14: Success Message
-- ==============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Invoice Template & Customization System created successfully!';
  RAISE NOTICE 'Created tables: invoice_templates, invoice_numbering_schemes, business_branding, invoice_notes, invoice_approval_workflows, invoice_approvals';
  RAISE NOTICE 'Extended invoices table with template integration fields';
  RAISE NOTICE 'Added indexes, RLS policies, and default system templates';
  RAISE NOTICE 'System is ready for template customization!';
END $$;