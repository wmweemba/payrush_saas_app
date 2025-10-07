-- Migration: Create Invoice Numbering Schemes System
-- Description: Add support for custom invoice numbering patterns with prefix, suffix, sequence management, and reset options

-- Create invoice numbering schemes table
CREATE TABLE IF NOT EXISTS invoice_numbering_schemes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Basic scheme information
    scheme_name VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Numbering pattern components
    prefix VARCHAR(10) DEFAULT '',
    suffix VARCHAR(10) DEFAULT '',
    sequence_length INTEGER DEFAULT 3 CHECK (sequence_length >= 1 AND sequence_length <= 10),
    current_number INTEGER DEFAULT 1 CHECK (current_number >= 1),
    
    -- Reset options
    reset_frequency VARCHAR(20) DEFAULT 'never' CHECK (reset_frequency IN ('never', 'yearly', 'monthly', 'quarterly')),
    reset_on DATE NULL, -- Specific date for custom resets
    
    -- Pattern preview for UI display
    pattern_preview VARCHAR(50) DEFAULT '',
    
    -- Date formatting options
    include_year BOOLEAN DEFAULT FALSE,
    include_month BOOLEAN DEFAULT FALSE,
    include_quarter BOOLEAN DEFAULT FALSE,
    date_format VARCHAR(10) DEFAULT 'YYYY' CHECK (date_format IN ('YYYY', 'YY')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_invoice_numbering_schemes_user_id ON invoice_numbering_schemes(user_id);
CREATE INDEX idx_invoice_numbering_schemes_default ON invoice_numbering_schemes(user_id, is_default) WHERE is_default = TRUE;
CREATE UNIQUE INDEX idx_invoice_numbering_schemes_user_name ON invoice_numbering_schemes(user_id, scheme_name);

-- Add RLS policies
ALTER TABLE invoice_numbering_schemes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own numbering schemes
CREATE POLICY "Users can access their own numbering schemes" ON invoice_numbering_schemes
    FOR ALL USING (auth.uid() = user_id);

-- Add numbering_scheme_id to invoices table (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'numbering_scheme_id'
    ) THEN
        ALTER TABLE invoices ADD COLUMN numbering_scheme_id UUID REFERENCES invoice_numbering_schemes(id) ON DELETE SET NULL;
        CREATE INDEX idx_invoices_numbering_scheme ON invoices(numbering_scheme_id);
    END IF;
END $$;

-- Add invoice_number column to invoices table (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'invoice_number'
    ) THEN
        ALTER TABLE invoices ADD COLUMN invoice_number VARCHAR(50);
        CREATE INDEX idx_invoices_invoice_number ON invoices(user_id, invoice_number);
    END IF;
END $$;

-- Create function to ensure only one default scheme per user
CREATE OR REPLACE FUNCTION ensure_single_default_numbering_scheme()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting this scheme as default, unset others
    IF NEW.is_default = TRUE THEN
        UPDATE invoice_numbering_schemes 
        SET is_default = FALSE 
        WHERE user_id = NEW.user_id 
        AND id != NEW.id 
        AND is_default = TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain single default scheme
DROP TRIGGER IF EXISTS ensure_single_default_numbering_scheme_trigger ON invoice_numbering_schemes;
CREATE TRIGGER ensure_single_default_numbering_scheme_trigger
    BEFORE INSERT OR UPDATE ON invoice_numbering_schemes
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_numbering_scheme();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_numbering_scheme_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at
DROP TRIGGER IF EXISTS update_numbering_scheme_updated_at_trigger ON invoice_numbering_schemes;
CREATE TRIGGER update_numbering_scheme_updated_at_trigger
    BEFORE UPDATE ON invoice_numbering_schemes
    FOR EACH ROW
    EXECUTE FUNCTION update_numbering_scheme_updated_at();

-- Create function to generate pattern preview
CREATE OR REPLACE FUNCTION generate_numbering_pattern_preview(
    p_prefix VARCHAR(10),
    p_suffix VARCHAR(10),
    p_sequence_length INTEGER,
    p_include_year BOOLEAN,
    p_include_month BOOLEAN,
    p_include_quarter BOOLEAN,
    p_date_format VARCHAR(10)
)
RETURNS VARCHAR(50) AS $$
DECLARE
    result VARCHAR(50) := '';
    date_parts VARCHAR(20) := '';
    year_part VARCHAR(4);
    quarter_part VARCHAR(2);
    month_part VARCHAR(2);
    sequence_part VARCHAR(10);
BEGIN
    -- Start with prefix
    IF p_prefix IS NOT NULL AND p_prefix != '' THEN
        result := p_prefix;
    END IF;
    
    -- Add date components
    IF p_include_year THEN
        IF p_date_format = 'YYYY' THEN
            year_part := EXTRACT(YEAR FROM NOW())::TEXT;
        ELSE
            year_part := RIGHT(EXTRACT(YEAR FROM NOW())::TEXT, 2);
        END IF;
        
        IF date_parts = '' THEN
            date_parts := year_part;
        ELSE
            date_parts := date_parts || '-' || year_part;
        END IF;
    END IF;
    
    IF p_include_quarter THEN
        quarter_part := 'Q' || EXTRACT(QUARTER FROM NOW())::TEXT;
        IF date_parts = '' THEN
            date_parts := quarter_part;
        ELSE
            date_parts := date_parts || '-' || quarter_part;
        END IF;
    END IF;
    
    IF p_include_month THEN
        month_part := LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0');
        IF date_parts = '' THEN
            date_parts := month_part;
        ELSE
            date_parts := date_parts || '-' || month_part;
        END IF;
    END IF;
    
    -- Add date parts to result
    IF date_parts != '' THEN
        IF result != '' THEN
            result := result || '-';
        END IF;
        result := result || date_parts;
    END IF;
    
    -- Add sequence number (using 1 as example)
    sequence_part := LPAD('1', p_sequence_length, '0');
    IF result != '' THEN
        result := result || '-';
    END IF;
    result := result || sequence_part;
    
    -- Add suffix
    IF p_suffix IS NOT NULL AND p_suffix != '' THEN
        result := result || p_suffix;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update pattern preview
CREATE OR REPLACE FUNCTION update_pattern_preview()
RETURNS TRIGGER AS $$
BEGIN
    NEW.pattern_preview := generate_numbering_pattern_preview(
        NEW.prefix,
        NEW.suffix,
        NEW.sequence_length,
        NEW.include_year,
        NEW.include_month,
        NEW.include_quarter,
        NEW.date_format
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_pattern_preview_trigger ON invoice_numbering_schemes;
CREATE TRIGGER update_pattern_preview_trigger
    BEFORE INSERT OR UPDATE ON invoice_numbering_schemes
    FOR EACH ROW
    EXECUTE FUNCTION update_pattern_preview();

-- Insert default numbering scheme for existing users (optional)
-- This will be handled by the application initialization endpoint