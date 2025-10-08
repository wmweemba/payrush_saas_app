-- Add template_id to invoices table for PDF template integration
-- This allows invoices to remember which template was selected during creation

-- Safely add template_id column to invoices table (only if it doesn't exist)
DO $$
DECLARE
    column_exists boolean;
BEGIN
    -- Check if template_id column already exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'template_id'
    ) INTO column_exists;
    
    -- Add column only if it doesn't exist
    IF NOT column_exists THEN
        ALTER TABLE invoices ADD COLUMN template_id UUID REFERENCES invoice_templates(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added template_id column to invoices table';
    ELSE
        RAISE NOTICE 'template_id column already exists in invoices table, skipping creation';
    END IF;
END $$;

-- Add index for better query performance when filtering by template (if not exists)
CREATE INDEX IF NOT EXISTS idx_invoices_template_id ON invoices(template_id);

-- Update existing invoices to use default template if available
-- This ensures backward compatibility for existing invoices
DO $$
DECLARE
    default_template_id UUID;
BEGIN
    -- Find a default template (prefer system default, then first available)
    SELECT id INTO default_template_id 
    FROM invoice_templates 
    WHERE is_default = true AND is_system_template = true
    LIMIT 1;
    
    -- If no system default found, use any default template
    IF default_template_id IS NULL THEN
        SELECT id INTO default_template_id 
        FROM invoice_templates 
        WHERE is_default = true
        LIMIT 1;
    END IF;
    
    -- If still no default found, use any available template
    IF default_template_id IS NULL THEN
        SELECT id INTO default_template_id 
        FROM invoice_templates 
        LIMIT 1;
    END IF;
    
    -- Update existing invoices with no template_id
    IF default_template_id IS NOT NULL THEN
        UPDATE invoices 
        SET template_id = default_template_id 
        WHERE template_id IS NULL;
        
        RAISE NOTICE 'Updated % invoices with default template %', 
            (SELECT COUNT(*) FROM invoices WHERE template_id = default_template_id),
            default_template_id;
    END IF;
END $$;

-- Add comment to document the purpose
COMMENT ON COLUMN invoices.template_id IS 'References the invoice template used for PDF generation. NULL means use default template.';