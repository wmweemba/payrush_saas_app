-- Fix approval workflow trigger to use correct status values and remove updated_at reference
-- This migration fixes the trigger that was causing constraint violations

-- Update the trigger function to use correct status values
CREATE OR REPLACE FUNCTION update_invoice_status_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Update invoice status based on approval status
  -- Use capitalized status values to match the constraint
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE invoices 
    SET 
      status = 'Sent'  -- Changed from 'approved' to 'Sent' (proper capitalization)
    WHERE id = NEW.invoice_id;
  ELSIF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    UPDATE invoices 
    SET 
      status = 'Pending'  -- Changed from 'draft' to 'Pending' (proper capitalization)
    WHERE id = NEW.invoice_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- The trigger itself doesn't need to be recreated since we're just updating the function
-- But let's verify it exists
DROP TRIGGER IF EXISTS trigger_update_invoice_status_on_approval ON invoice_approvals;
CREATE TRIGGER trigger_update_invoice_status_on_approval
  AFTER UPDATE OF status ON invoice_approvals
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_status_on_approval();

-- Verification query to check the constraint values
-- SELECT conname, consrc FROM pg_constraint WHERE conname = 'invoices_status_check';