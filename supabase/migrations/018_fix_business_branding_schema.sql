-- Fix Business Branding Schema Migration
-- This migration ensures the business_branding table has all required columns

-- First, check if the table exists and create it if it doesn't
DO $$
BEGIN
    -- Create the table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'business_branding') THEN
        CREATE TABLE business_branding (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            
            -- Logo and Brand Assets
            logo_url TEXT,
            logo_filename TEXT,
            logo_size INTEGER,
            favicon_url TEXT,
            
            -- Brand Colors
            primary_color VARCHAR(7) DEFAULT '#2563eb',
            secondary_color VARCHAR(7) DEFAULT '#64748b',
            accent_color VARCHAR(7) DEFAULT '#10b981',
            text_color VARCHAR(7) DEFAULT '#1f2937',
            background_color VARCHAR(7) DEFAULT '#ffffff',
            
            -- Typography Settings
            primary_font VARCHAR(100) DEFAULT 'Inter, sans-serif',
            heading_font VARCHAR(100) DEFAULT 'Inter, sans-serif',
            
            -- Brand Settings
            company_name TEXT,
            company_tagline TEXT,
            company_website TEXT,
            
            -- Template Integration
            default_template_id UUID,
            apply_branding_to_templates BOOLEAN DEFAULT true,
            apply_branding_to_emails BOOLEAN DEFAULT true,
            
            -- Metadata
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            
            -- Constraints
            CONSTRAINT valid_primary_color CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
            CONSTRAINT valid_secondary_color CHECK (secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
            CONSTRAINT valid_accent_color CHECK (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
            CONSTRAINT valid_text_color CHECK (text_color ~ '^#[0-9A-Fa-f]{6}$'),
            CONSTRAINT valid_background_color CHECK (background_color ~ '^#[0-9A-Fa-f]{6}$'),
            CONSTRAINT unique_user_branding UNIQUE(user_id)
        );
        
        RAISE NOTICE 'Created business_branding table';
    ELSE
        RAISE NOTICE 'business_branding table already exists';
    END IF;
END $$;

-- Now add any missing columns to the existing table
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Check and add apply_branding_to_templates column
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_branding' 
        AND column_name = 'apply_branding_to_templates'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE business_branding ADD COLUMN apply_branding_to_templates BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added apply_branding_to_templates column';
    ELSE
        RAISE NOTICE 'apply_branding_to_templates column already exists';
    END IF;
    
    -- Check and add apply_branding_to_emails column
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_branding' 
        AND column_name = 'apply_branding_to_emails'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE business_branding ADD COLUMN apply_branding_to_emails BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added apply_branding_to_emails column';
    ELSE
        RAISE NOTICE 'apply_branding_to_emails column already exists';
    END IF;
    
    -- Check and add other potentially missing columns
    
    -- company_name
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_branding' 
        AND column_name = 'company_name'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE business_branding ADD COLUMN company_name TEXT;
        RAISE NOTICE 'Added company_name column';
    END IF;
    
    -- company_tagline
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_branding' 
        AND column_name = 'company_tagline'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE business_branding ADD COLUMN company_tagline TEXT;
        RAISE NOTICE 'Added company_tagline column';
    END IF;
    
    -- company_website
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_branding' 
        AND column_name = 'company_website'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE business_branding ADD COLUMN company_website TEXT;
        RAISE NOTICE 'Added company_website column';
    END IF;
    
    -- primary_font
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_branding' 
        AND column_name = 'primary_font'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE business_branding ADD COLUMN primary_font VARCHAR(100) DEFAULT 'Inter, sans-serif';
        RAISE NOTICE 'Added primary_font column';
    END IF;
    
    -- heading_font
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_branding' 
        AND column_name = 'heading_font'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE business_branding ADD COLUMN heading_font VARCHAR(100) DEFAULT 'Inter, sans-serif';
        RAISE NOTICE 'Added heading_font column';
    END IF;
    
    -- Logo fields
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_branding' 
        AND column_name = 'logo_url'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE business_branding ADD COLUMN logo_url TEXT;
        RAISE NOTICE 'Added logo_url column';
    END IF;
    
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_branding' 
        AND column_name = 'logo_filename'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE business_branding ADD COLUMN logo_filename TEXT;
        RAISE NOTICE 'Added logo_filename column';
    END IF;
    
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_branding' 
        AND column_name = 'logo_size'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE business_branding ADD COLUMN logo_size INTEGER;
        RAISE NOTICE 'Added logo_size column';
    END IF;
    
    -- Color fields
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_branding' 
        AND column_name = 'primary_color'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE business_branding ADD COLUMN primary_color VARCHAR(7) DEFAULT '#2563eb';
        RAISE NOTICE 'Added primary_color column';
    END IF;
    
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_branding' 
        AND column_name = 'secondary_color'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE business_branding ADD COLUMN secondary_color VARCHAR(7) DEFAULT '#64748b';
        RAISE NOTICE 'Added secondary_color column';
    END IF;
    
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_branding' 
        AND column_name = 'accent_color'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE business_branding ADD COLUMN accent_color VARCHAR(7) DEFAULT '#10b981';
        RAISE NOTICE 'Added accent_color column';
    END IF;
    
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_branding' 
        AND column_name = 'text_color'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE business_branding ADD COLUMN text_color VARCHAR(7) DEFAULT '#1f2937';
        RAISE NOTICE 'Added text_color column';
    END IF;
    
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_branding' 
        AND column_name = 'background_color'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE business_branding ADD COLUMN background_color VARCHAR(7) DEFAULT '#ffffff';
        RAISE NOTICE 'Added background_color column';
    END IF;
    
END $$;

-- Create indexes if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_business_branding_user_id') THEN
        CREATE INDEX idx_business_branding_user_id ON business_branding(user_id);
        RAISE NOTICE 'Created index on user_id';
    END IF;
END $$;

-- Enable Row Level Security if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_class WHERE relname = 'business_branding' AND relrowsecurity = true) THEN
        ALTER TABLE business_branding ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on business_branding';
    END IF;
END $$;

-- Create RLS policies if they don't exist
DO $$
BEGIN
    -- Check if policies exist and create them if they don't
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'business_branding' AND policyname = 'Users can view their own branding') THEN
        CREATE POLICY "Users can view their own branding" ON business_branding
            FOR SELECT USING (auth.uid() = user_id);
        RAISE NOTICE 'Created SELECT policy';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'business_branding' AND policyname = 'Users can create their own branding') THEN
        CREATE POLICY "Users can create their own branding" ON business_branding
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        RAISE NOTICE 'Created INSERT policy';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'business_branding' AND policyname = 'Users can update their own branding') THEN
        CREATE POLICY "Users can update their own branding" ON business_branding
            FOR UPDATE USING (auth.uid() = user_id);
        RAISE NOTICE 'Created UPDATE policy';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'business_branding' AND policyname = 'Users can delete their own branding') THEN
        CREATE POLICY "Users can delete their own branding" ON business_branding
            FOR DELETE USING (auth.uid() = user_id);
        RAISE NOTICE 'Created DELETE policy';
    END IF;
END $$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON business_branding TO authenticated;

-- Display current table structure for verification
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'business_branding'
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Business branding schema migration completed successfully!';
    RAISE NOTICE 'The business_branding table now has all required columns.';
END $$;