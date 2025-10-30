-- Migration: Fix invoice status constraint to include 'cancelled' status
-- Date: 2025-10-30
-- Description: Update the invoices_status_check constraint to allow 'cancelled' as a valid status
--              This resolves the issue where cancelled invoices show as 'draft' instead of 'cancelled'

-- Step 1: Check current constraint (for reference)
-- The current constraint likely only allows: 'draft', 'sent', 'paid', 'overdue'
-- We need to add 'cancelled' to this list

-- Step 2: Drop the existing constraint
ALTER TABLE invoices 
DROP CONSTRAINT IF EXISTS invoices_status_check;

-- Step 3: Add the updated constraint with 'cancelled' included
ALTER TABLE invoices 
ADD CONSTRAINT invoices_status_check 
CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled'));

-- Step 4: Update any existing invoices that have status 'draft' but approval_status 'cancelled'
-- These should be changed to status 'cancelled' to reflect the correct state
UPDATE invoices 
SET status = 'cancelled' 
WHERE status = 'draft' 
  AND approval_status = 'cancelled';

-- Step 5: Verification query to check the updated constraint and data
-- Run this to verify the changes worked:
-- SELECT 
--   constraint_name, 
--   check_clause 
-- FROM information_schema.check_constraints 
-- WHERE constraint_name = 'invoices_status_check';

-- Step 6: Check status distribution after update
-- SELECT status, COUNT(*) as count 
-- FROM invoices 
-- GROUP BY status 
-- ORDER BY status;

-- Optional: Check for any invoices that might still have inconsistent status/approval_status combinations
-- SELECT 
--   id, 
--   status, 
--   approval_status, 
--   customer_name 
-- FROM invoices 
-- WHERE 
--   (status = 'draft' AND approval_status = 'cancelled') OR
--   (status = 'cancelled' AND approval_status != 'cancelled' AND approval_status IS NOT NULL)
-- LIMIT 10;