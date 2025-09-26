-- Migration: Fix profiles table schema
-- Date: 2025-09-26
-- Description: Ensure profiles table has correct columns and structure

-- First, let's check what columns exist and add missing ones
DO $$ 
BEGIN
    -- Add name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'name'
    ) THEN
        ALTER TABLE profiles ADD COLUMN name text;
    END IF;

    -- Add business_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'business_name'
    ) THEN
        ALTER TABLE profiles ADD COLUMN business_name text;
    END IF;

    -- Add phone column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'phone'
    ) THEN
        ALTER TABLE profiles ADD COLUMN phone text;
    END IF;

    -- Add address column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'address'
    ) THEN
        ALTER TABLE profiles ADD COLUMN address text;
    END IF;

    -- Add website column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'website'
    ) THEN
        ALTER TABLE profiles ADD COLUMN website text;
    END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN created_at timestamptz DEFAULT now();
    END IF;
END $$;

-- Set constraints for required fields
ALTER TABLE profiles 
ALTER COLUMN name SET NOT NULL,
ALTER COLUMN business_name SET NOT NULL;

-- Set default values for existing records that might have NULL values
UPDATE profiles 
SET name = COALESCE(name, 'User')
WHERE name IS NULL;

UPDATE profiles 
SET business_name = COALESCE(business_name, 'My Business')
WHERE business_name IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_business_name ON profiles(business_name);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- Ensure RLS is enabled and policies exist
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Display final schema for verification
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;