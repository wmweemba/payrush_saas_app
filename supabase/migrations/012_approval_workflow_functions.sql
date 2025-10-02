-- Add approval statistics function to support analytics
-- This migration adds utility functions for approval workflow analytics

-- Function to get approval statistics for a user
CREATE OR REPLACE FUNCTION get_approval_statistics(
  user_id UUID,
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  total_approvals BIGINT,
  pending_approvals BIGINT,
  approved_count BIGINT,
  rejected_count BIGINT,
  average_approval_time NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH approval_stats AS (
    SELECT 
      ia.status,
      ia.submitted_at,
      ia.approved_at,
      CASE 
        WHEN ia.approved_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (ia.approved_at - ia.submitted_at)) / 3600.0 
        ELSE NULL 
      END as approval_time_hours
    FROM invoice_approvals ia
    JOIN invoices i ON ia.invoice_id = i.id
    WHERE i.user_id = get_approval_statistics.user_id
    AND ia.submitted_at >= start_date
    AND ia.submitted_at <= end_date
  )
  SELECT 
    COUNT(*)::BIGINT as total_approvals,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_approvals,
    COUNT(*) FILTER (WHERE status = 'approved')::BIGINT as approved_count,
    COUNT(*) FILTER (WHERE status = 'rejected')::BIGINT as rejected_count,
    COALESCE(AVG(approval_time_hours), 0)::NUMERIC as average_approval_time
  FROM approval_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_approval_statistics(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- Function to check if a user is authorized for a specific approval step
CREATE OR REPLACE FUNCTION is_user_authorized_for_approval(
  approval_id UUID,
  user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  workflow_data JSONB;
  current_step INTEGER;
  step_config JSONB;
  approvers JSONB;
BEGIN
  -- Get workflow and current step data
  SELECT 
    iaw.approval_steps,
    ia.current_step
  INTO workflow_data, current_step
  FROM invoice_approvals ia
  JOIN invoice_approval_workflows iaw ON ia.workflow_id = iaw.id
  WHERE ia.id = approval_id;

  -- If no workflow found, return false
  IF workflow_data IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get the current step configuration
  step_config := workflow_data->current_step;
  
  -- If step doesn't exist, return false
  IF step_config IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get approvers array for current step
  approvers := step_config->'approvers';
  
  -- Check if user is in approvers array
  RETURN approvers ? user_id::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_user_authorized_for_approval(UUID, UUID) TO authenticated;

-- Add index for better performance on approval queries
CREATE INDEX IF NOT EXISTS idx_invoice_approvals_status_submitted 
ON invoice_approvals(status, submitted_at);

CREATE INDEX IF NOT EXISTS idx_invoice_approvals_workflow_status 
ON invoice_approvals(workflow_id, status);

-- Add trigger to automatically update invoice status when approval status changes
CREATE OR REPLACE FUNCTION update_invoice_status_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Update invoice status based on approval status
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE invoices 
    SET 
      status = 'approved',
      updated_at = NOW()
    WHERE id = NEW.invoice_id;
  ELSIF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    UPDATE invoices 
    SET 
      status = 'draft',
      updated_at = NOW()
    WHERE id = NEW.invoice_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_update_invoice_status_on_approval ON invoice_approvals;
CREATE TRIGGER trigger_update_invoice_status_on_approval
  AFTER UPDATE OF status ON invoice_approvals
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_status_on_approval();

-- Add helpful view for pending approvals (safe version)
-- This view will be created conditionally based on what columns actually exist
DO $$
DECLARE
    has_custom_invoice_number boolean;
    has_customer_name boolean;
    has_total_amount boolean;
    has_currency boolean;
    view_sql text;
BEGIN
    -- Check what columns exist in the invoices table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'custom_invoice_number'
    ) INTO has_custom_invoice_number;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'customer_name'
    ) INTO has_customer_name;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'total_amount'
    ) INTO has_total_amount;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'currency'
    ) INTO has_currency;
    
    -- Build the view SQL dynamically based on available columns
    view_sql := 'CREATE OR REPLACE VIEW pending_approvals_view AS
    SELECT 
      ia.id as approval_id,
      ia.invoice_id,';
      
    -- Add invoice number column
    IF has_custom_invoice_number THEN
        view_sql := view_sql || '
      COALESCE(i.custom_invoice_number, ''INV-'' || i.id::text) as invoice_number,';
    ELSE
        view_sql := view_sql || '
      ''INV-'' || i.id::text as invoice_number,';
    END IF;
    
    -- Add client name column  
    IF has_customer_name THEN
        view_sql := view_sql || '
      COALESCE(i.customer_name, ''Unknown Client'') as client_name,';
    ELSE
        view_sql := view_sql || '
      ''Unknown Client'' as client_name,';
    END IF;
    
    -- Add total amount column
    IF has_total_amount THEN
        view_sql := view_sql || '
      COALESCE(i.total_amount, 0) as total_amount,';
    ELSE
        view_sql := view_sql || '
      0 as total_amount,';
    END IF;
    
    -- Add currency column
    IF has_currency THEN
        view_sql := view_sql || '
      COALESCE(i.currency, ''USD'') as currency,';
    ELSE
        view_sql := view_sql || '
      ''USD'' as currency,';
    END IF;
    
    -- Add the rest of the view
    view_sql := view_sql || '
      ia.submitted_at,
      ia.current_step,
      iaw.workflow_name as workflow_name,
      iaw.approval_steps,
      (iaw.approval_steps->ia.current_step) as current_step_config,
      i.user_id as invoice_owner
    FROM invoice_approvals ia
    JOIN invoices i ON ia.invoice_id = i.id
    JOIN invoice_approval_workflows iaw ON ia.workflow_id = iaw.id
    WHERE ia.status = ''pending''
    AND iaw.is_active = true';
    
    -- Execute the dynamic SQL
    EXECUTE view_sql;
    
    RAISE NOTICE 'Created pending_approvals_view with available columns';
END $$;

-- Grant access to the view (views don't support RLS policies)
-- Access control is handled by the underlying tables' RLS policies
GRANT SELECT ON pending_approvals_view TO authenticated;