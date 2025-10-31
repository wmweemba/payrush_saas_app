-- Ensure Brand Assets Table Migration
-- This migration ensures the brand_assets table exists and is properly configured

-- Create brand_assets table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'brand_assets') THEN
        CREATE TABLE brand_assets (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            branding_id UUID REFERENCES business_branding(id) ON DELETE SET NULL,
            
            -- Asset Information
            asset_name VARCHAR(255) NOT NULL,
            asset_type VARCHAR(50) NOT NULL, -- 'logo', 'favicon', 'letterhead', 'signature', 'background'
            file_url TEXT NOT NULL, -- URL to file stored in Supabase Storage
            file_name TEXT NOT NULL, -- Original filename
            file_size INTEGER NOT NULL, -- File size in bytes
            file_type VARCHAR(50) NOT NULL, -- MIME type (image/png, image/jpeg, etc.)
            
            -- Asset Metadata
            width INTEGER, -- Image width in pixels
            height INTEGER, -- Image height in pixels
            alt_text TEXT, -- Alternative text for accessibility
            description TEXT, -- Asset description
            
            -- Usage Settings
            is_active BOOLEAN DEFAULT true,
            usage_context JSONB DEFAULT '{}', -- JSON object for usage contexts (templates, emails, etc.)
            
            -- Metadata
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            
            -- Constraints
            CONSTRAINT valid_asset_type CHECK (asset_type IN ('logo', 'favicon', 'letterhead', 'signature', 'background', 'preset'))
        );
        
        RAISE NOTICE 'Created brand_assets table';
    ELSE
        RAISE NOTICE 'brand_assets table already exists';
    END IF;
END $$;

-- Add missing columns if they don't exist
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Check and add branding_id column if missing
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'brand_assets' 
        AND column_name = 'branding_id'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE brand_assets ADD COLUMN branding_id UUID REFERENCES business_branding(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added branding_id column to brand_assets';
    END IF;
    
    -- Check and add asset_name column if missing
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'brand_assets' 
        AND column_name = 'asset_name'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE brand_assets ADD COLUMN asset_name VARCHAR(255) NOT NULL DEFAULT 'Untitled Asset';
        RAISE NOTICE 'Added asset_name column to brand_assets';
    END IF;
    
    -- Check and add asset_type column if missing
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'brand_assets' 
        AND column_name = 'asset_type'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE brand_assets ADD COLUMN asset_type VARCHAR(50) NOT NULL DEFAULT 'logo';
        RAISE NOTICE 'Added asset_type column to brand_assets';
    END IF;
    
    -- Check and add file_url column if missing
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'brand_assets' 
        AND column_name = 'file_url'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE brand_assets ADD COLUMN file_url TEXT NOT NULL DEFAULT '';
        RAISE NOTICE 'Added file_url column to brand_assets';
    END IF;
    
    -- Check and add file_name column if missing
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'brand_assets' 
        AND column_name = 'file_name'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE brand_assets ADD COLUMN file_name TEXT NOT NULL DEFAULT '';
        RAISE NOTICE 'Added file_name column to brand_assets';
    END IF;
    
    -- Check and add file_size column if missing
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'brand_assets' 
        AND column_name = 'file_size'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE brand_assets ADD COLUMN file_size INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE 'Added file_size column to brand_assets';
    END IF;
    
    -- Check and add file_type column if missing
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'brand_assets' 
        AND column_name = 'file_type'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE brand_assets ADD COLUMN file_type VARCHAR(50) NOT NULL DEFAULT 'image/png';
        RAISE NOTICE 'Added file_type column to brand_assets';
    END IF;
    
    -- Check and add width column if missing
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'brand_assets' 
        AND column_name = 'width'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE brand_assets ADD COLUMN width INTEGER;
        RAISE NOTICE 'Added width column to brand_assets';
    END IF;
    
    -- Check and add height column if missing
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'brand_assets' 
        AND column_name = 'height'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE brand_assets ADD COLUMN height INTEGER;
        RAISE NOTICE 'Added height column to brand_assets';
    END IF;
    
    -- Check and add alt_text column if missing
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'brand_assets' 
        AND column_name = 'alt_text'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE brand_assets ADD COLUMN alt_text TEXT;
        RAISE NOTICE 'Added alt_text column to brand_assets';
    END IF;
    
    -- Check and add description column if missing
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'brand_assets' 
        AND column_name = 'description'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE brand_assets ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description column to brand_assets';
    END IF;
    
    -- Check and add is_active column if missing
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'brand_assets' 
        AND column_name = 'is_active'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE brand_assets ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column to brand_assets';
    END IF;
    
    -- Check and add usage_context column if missing
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'brand_assets' 
        AND column_name = 'usage_context'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE brand_assets ADD COLUMN usage_context JSONB DEFAULT '{}';
        RAISE NOTICE 'Added usage_context column to brand_assets';
    END IF;
    
    -- Check and add created_at column if missing
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'brand_assets' 
        AND column_name = 'created_at'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE brand_assets ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added created_at column to brand_assets';
    END IF;
    
    -- Check and add updated_at column if missing
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'brand_assets' 
        AND column_name = 'updated_at'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE brand_assets ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added updated_at column to brand_assets';
    END IF;
END $$;

-- Create indexes for better performance
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_brand_assets_user_id') THEN
        CREATE INDEX idx_brand_assets_user_id ON brand_assets(user_id);
        RAISE NOTICE 'Created index on brand_assets.user_id';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_brand_assets_branding_id') THEN
        CREATE INDEX idx_brand_assets_branding_id ON brand_assets(branding_id);
        RAISE NOTICE 'Created index on brand_assets.branding_id';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_brand_assets_type') THEN
        CREATE INDEX idx_brand_assets_type ON brand_assets(asset_type);
        RAISE NOTICE 'Created index on brand_assets.asset_type';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_brand_assets_active') THEN
        CREATE INDEX idx_brand_assets_active ON brand_assets(is_active);
        RAISE NOTICE 'Created index on brand_assets.is_active';
    END IF;
END $$;

-- Enable Row Level Security
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_class WHERE relname = 'brand_assets' AND relrowsecurity = true) THEN
        ALTER TABLE brand_assets ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on brand_assets';
    END IF;
END $$;

-- Create RLS policies for brand_assets
DO $$
BEGIN
    -- Check if policies exist and create them if they don't
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'brand_assets' AND policyname = 'Users can view their own brand assets') THEN
        CREATE POLICY "Users can view their own brand assets" ON brand_assets
            FOR SELECT USING (auth.uid() = user_id);
        RAISE NOTICE 'Created SELECT policy for brand_assets';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'brand_assets' AND policyname = 'Users can create their own brand assets') THEN
        CREATE POLICY "Users can create their own brand assets" ON brand_assets
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        RAISE NOTICE 'Created INSERT policy for brand_assets';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'brand_assets' AND policyname = 'Users can update their own brand assets') THEN
        CREATE POLICY "Users can update their own brand assets" ON brand_assets
            FOR UPDATE USING (auth.uid() = user_id);
        RAISE NOTICE 'Created UPDATE policy for brand_assets';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'brand_assets' AND policyname = 'Users can delete their own brand assets') THEN
        CREATE POLICY "Users can delete their own brand assets" ON brand_assets
            FOR DELETE USING (auth.uid() = user_id);
        RAISE NOTICE 'Created DELETE policy for brand_assets';
    END IF;
END $$;

-- Create function to automatically update updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_brand_assets_updated_at') THEN
        CREATE TRIGGER update_brand_assets_updated_at
            BEFORE UPDATE ON brand_assets
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created update trigger for brand_assets';
    END IF;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON brand_assets TO authenticated;

-- Display current table structure for verification
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    CASE 
        WHEN is_nullable = 'NO' THEN 'NOT NULL' 
        ELSE 'NULL' 
    END AS null_constraint
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'brand_assets'
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Brand assets table migration completed successfully!';
    RAISE NOTICE 'The brand_assets table now has all required columns and proper RLS policies.';
    RAISE NOTICE 'Assets can now be uploaded and stored properly.';
END $$;