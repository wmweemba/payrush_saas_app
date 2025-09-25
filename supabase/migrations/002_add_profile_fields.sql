-- Migration: Add additional profile fields
-- Date: 2025-09-25
-- Description: Add phone, address, and website fields to profiles table

-- Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS website text;

-- Add indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_profiles_business_name ON profiles(business_name);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone) WHERE phone IS NOT NULL;

-- Update the planning documentation fields
-- profiles table now includes:
-- - id (uuid, references auth.users)
-- - name (text, NOT NULL)
-- - business_name (text, NOT NULL) 
-- - phone (text, nullable)
-- - address (text, nullable)
-- - website (text, nullable)
-- - created_at (timestamptz, default now())