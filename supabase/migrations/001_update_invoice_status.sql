-- Migration: Update invoice status field with new values and default
-- Date: 2025-09-25
-- Description: Update invoices table status field to support new lifecycle states

-- Step 1: Update existing constraint to support new status values
ALTER TABLE invoices 
DROP CONSTRAINT IF EXISTS invoices_status_check;

-- Step 2: Add new constraint with updated status values
ALTER TABLE invoices 
ADD CONSTRAINT invoices_status_check 
CHECK (status IN ('Pending', 'Sent', 'Paid', 'Overdue', 'Cancelled'));

-- Step 3: Update existing invoices with old status values
UPDATE invoices 
SET status = 'Pending' 
WHERE status = 'draft';

UPDATE invoices 
SET status = 'Sent' 
WHERE status = 'sent';

UPDATE invoices 
SET status = 'Paid' 
WHERE status = 'paid';

UPDATE invoices 
SET status = 'Overdue' 
WHERE status = 'overdue';

-- Step 4: Update default value for new invoices
ALTER TABLE invoices 
ALTER COLUMN status SET DEFAULT 'Pending';

-- Step 5: Ensure column is not null
ALTER TABLE invoices 
ALTER COLUMN status SET NOT NULL;

-- Verification query to check updated statuses
-- SELECT status, COUNT(*) FROM invoices GROUP BY status;