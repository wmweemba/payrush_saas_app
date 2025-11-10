-- Add Payment Information Fields to Business Branding
-- This migration adds payment-related columns to the business_branding table

DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Check and add bank_name column
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_branding' 
        AND column_name = 'bank_name'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE business_branding ADD COLUMN bank_name TEXT;
        RAISE NOTICE 'Added bank_name column';
    ELSE
        RAISE NOTICE 'bank_name column already exists';
    END IF;
    
    -- Check and add account_number column
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_branding' 
        AND column_name = 'account_number'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE business_branding ADD COLUMN account_number TEXT;
        RAISE NOTICE 'Added account_number column';
    ELSE
        RAISE NOTICE 'account_number column already exists';
    END IF;
    
    -- Check and add routing_number column
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_branding' 
        AND column_name = 'routing_number'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE business_branding ADD COLUMN routing_number TEXT;
        RAISE NOTICE 'Added routing_number column';
    ELSE
        RAISE NOTICE 'routing_number column already exists';
    END IF;
    
    -- Check and add account_holder_name column
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_branding' 
        AND column_name = 'account_holder_name'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE business_branding ADD COLUMN account_holder_name TEXT;
        RAISE NOTICE 'Added account_holder_name column';
    ELSE
        RAISE NOTICE 'account_holder_name column already exists';
    END IF;
    
    -- Check and add payment_instructions column
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_branding' 
        AND column_name = 'payment_instructions'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE business_branding ADD COLUMN payment_instructions TEXT;
        RAISE NOTICE 'Added payment_instructions column';
    ELSE
        RAISE NOTICE 'payment_instructions column already exists';
    END IF;
    
    -- Check and add preferred_payment_methods column (JSON array)
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_branding' 
        AND column_name = 'preferred_payment_methods'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE business_branding ADD COLUMN preferred_payment_methods JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added preferred_payment_methods column';
    ELSE
        RAISE NOTICE 'preferred_payment_methods column already exists';
    END IF;
    
END $$;

-- Display updated table structure for verification
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'business_branding'
AND column_name IN ('bank_name', 'account_number', 'routing_number', 'account_holder_name', 'payment_instructions', 'preferred_payment_methods')
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Payment fields migration completed successfully!';
    RAISE NOTICE 'The business_branding table now includes payment information fields.';
END $$;