-- Business Branding System Migration
-- This migration creates tables for storing business branding information including logos, colors, and brand assets

-- Create business_branding table
CREATE TABLE IF NOT EXISTS business_branding (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Logo and Brand Assets
    logo_url TEXT, -- URL to logo stored in Supabase Storage
    logo_filename TEXT, -- Original filename of uploaded logo
    logo_size INTEGER, -- File size in bytes
    favicon_url TEXT, -- URL to favicon stored in Supabase Storage
    
    -- Brand Colors
    primary_color VARCHAR(7) DEFAULT '#2563eb', -- Hex color code for primary brand color
    secondary_color VARCHAR(7) DEFAULT '#64748b', -- Hex color code for secondary brand color
    accent_color VARCHAR(7) DEFAULT '#10b981', -- Hex color code for accent brand color
    text_color VARCHAR(7) DEFAULT '#1f2937', -- Hex color code for primary text
    background_color VARCHAR(7) DEFAULT '#ffffff', -- Hex color code for background
    
    -- Typography Settings
    primary_font VARCHAR(100) DEFAULT 'Inter, sans-serif',
    heading_font VARCHAR(100) DEFAULT 'Inter, sans-serif',
    
    -- Brand Settings
    company_name TEXT,
    company_tagline TEXT,
    company_website TEXT,
    
    -- Template Integration
    default_template_id UUID, -- Reference to default invoice template
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

-- Create brand_assets table for storing additional brand assets
CREATE TABLE IF NOT EXISTS brand_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    branding_id UUID NOT NULL REFERENCES business_branding(id) ON DELETE CASCADE,
    
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_branding_user_id ON business_branding(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_assets_user_id ON brand_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_assets_branding_id ON brand_assets(branding_id);
CREATE INDEX IF NOT EXISTS idx_brand_assets_type ON brand_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_brand_assets_active ON brand_assets(is_active);

-- Enable Row Level Security
ALTER TABLE business_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_assets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for business_branding
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own branding" ON business_branding;
    DROP POLICY IF EXISTS "Users can create their own branding" ON business_branding;
    DROP POLICY IF EXISTS "Users can update their own branding" ON business_branding;
    DROP POLICY IF EXISTS "Users can delete their own branding" ON business_branding;
    
    -- Create new policies
    CREATE POLICY "Users can view their own branding" ON business_branding
        FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can create their own branding" ON business_branding
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own branding" ON business_branding
        FOR UPDATE USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete their own branding" ON business_branding
        FOR DELETE USING (auth.uid() = user_id);
END $$;

-- Create RLS policies for brand_assets
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own brand assets" ON brand_assets;
    DROP POLICY IF EXISTS "Users can create their own brand assets" ON brand_assets;
    DROP POLICY IF EXISTS "Users can update their own brand assets" ON brand_assets;
    DROP POLICY IF EXISTS "Users can delete their own brand assets" ON brand_assets;
    
    -- Create new policies
    CREATE POLICY "Users can view their own brand assets" ON brand_assets
        FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can create their own brand assets" ON brand_assets
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own brand assets" ON brand_assets
        FOR UPDATE USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete their own brand assets" ON brand_assets
        FOR DELETE USING (auth.uid() = user_id);
END $$;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
DO $$
BEGIN
    -- Drop existing triggers if they exist
    DROP TRIGGER IF EXISTS update_business_branding_updated_at ON business_branding;
    DROP TRIGGER IF EXISTS update_brand_assets_updated_at ON brand_assets;
    
    -- Create new triggers
    CREATE TRIGGER update_business_branding_updated_at
        BEFORE UPDATE ON business_branding
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    
    CREATE TRIGGER update_brand_assets_updated_at
        BEFORE UPDATE ON brand_assets
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
END $$;

-- Create function to get user's branding information
CREATE OR REPLACE FUNCTION get_user_branding(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    logo_url TEXT,
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    accent_color VARCHAR(7),
    company_name TEXT,
    company_tagline TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bb.id,
        bb.logo_url,
        bb.primary_color,
        bb.secondary_color,
        bb.accent_color,
        bb.company_name,
        bb.company_tagline,
        bb.created_at
    FROM business_branding bb
    WHERE bb.user_id = p_user_id;
END;
$$;

-- Create function to initialize default branding for new users
CREATE OR REPLACE FUNCTION initialize_default_branding(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    branding_id UUID;
BEGIN
    -- Check if branding already exists
    SELECT id INTO branding_id
    FROM business_branding
    WHERE user_id = p_user_id;
    
    -- If no branding exists, create default branding
    IF branding_id IS NULL THEN
        INSERT INTO business_branding (
            user_id,
            primary_color,
            secondary_color,
            accent_color,
            text_color,
            background_color,
            primary_font,
            heading_font,
            apply_branding_to_templates,
            apply_branding_to_emails
        ) VALUES (
            p_user_id,
            '#2563eb',
            '#64748b',
            '#10b981',
            '#1f2937',
            '#ffffff',
            'Inter, sans-serif',
            'Inter, sans-serif',
            true,
            true
        )
        RETURNING id INTO branding_id;
    END IF;
    
    RETURN branding_id;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON business_branding TO authenticated;
GRANT ALL ON brand_assets TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_branding(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_default_branding(UUID) TO authenticated;

-- Insert comment for migration tracking
COMMENT ON TABLE business_branding IS 'Stores business branding information including logos, colors, and brand settings for invoice customization';
COMMENT ON TABLE brand_assets IS 'Stores additional brand assets like logos, favicons, letterheads, and other brand materials';