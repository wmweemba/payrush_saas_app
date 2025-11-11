-- Migration: Fix payment method constraint
-- Date: 2025-11-11
-- Description: Drop and recreate payment method constraint to ensure it works properly

-- Step 1: Drop existing constraint if it exists
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_payment_method_check;

-- Step 2: Recreate the constraint with correct values
ALTER TABLE invoices ADD CONSTRAINT invoices_payment_method_check 
CHECK (payment_method IS NULL OR payment_method IN (
  'bank_transfer',
  'cash', 
  'mobile_money',
  'card',
  'flutterwave',
  'stripe',
  'paypal',
  'other'
));

-- Step 3: Verification - show current constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'invoices_payment_method_check';

-- Step 4: Test the constraint (this should work)
-- INSERT INTO invoices (user_id, customer_name, amount, currency, payment_method) 
-- VALUES ('00000000-0000-0000-0000-000000000000', 'Test', 100, 'USD', 'bank_transfer');

-- Step 5: Show sample of what payment methods are currently in use
SELECT DISTINCT payment_method, COUNT(*) as count
FROM invoices 
WHERE payment_method IS NOT NULL
GROUP BY payment_method;