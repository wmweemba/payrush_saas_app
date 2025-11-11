-- Migration: Add payment tracking fields to invoices table
-- Date: 2025-11-11
-- Description: Add fields to track manual payment information when invoices are marked as paid

-- Step 1: Add payment tracking columns to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_notes TEXT;

-- Step 2: Add index on paid_at for performance (payment reporting queries)
CREATE INDEX IF NOT EXISTS idx_invoices_paid_at ON invoices(paid_at);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_method ON invoices(payment_method);

-- Step 3: Add check constraint for payment_method values (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'invoices_payment_method_check' 
        AND table_name = 'invoices'
    ) THEN
        ALTER TABLE invoices ADD CONSTRAINT invoices_payment_method_check 
        CHECK (payment_method IS NULL OR payment_method IN (
          'manual_bank_transfer',
          'bank_transfer', 
          'cash',
          'mobile_money',
          'card',
          'flutterwave',
          'stripe',
          'paypal',
          'other'
        ));
    END IF;
END $$;

-- Step 4: Update existing paid invoices to have a paid_at timestamp (use created_at as fallback)
UPDATE invoices 
SET paid_at = created_at 
WHERE status = 'paid' AND paid_at IS NULL;

-- Verification queries
-- Check new columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'invoices' 
AND column_name IN ('paid_at', 'payment_method', 'payment_notes')
ORDER BY column_name;

-- Show sample data structure
-- SELECT id, status, paid_at, payment_method, payment_notes FROM invoices LIMIT 5;