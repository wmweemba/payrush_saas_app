-- Migration: Create invoice line items system
-- Date: 2025-10-01
-- Description: Add support for line items in invoices with quantities, descriptions, unit prices

-- Step 1: Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
  unit_price DECIMAL(12, 2) NOT NULL,
  line_total DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT invoice_items_quantity_positive CHECK (quantity > 0),
  CONSTRAINT invoice_items_unit_price_positive CHECK (unit_price >= 0),
  CONSTRAINT invoice_items_description_not_empty CHECK (length(trim(description)) > 0)
);

-- Step 2: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_sort_order ON invoice_items(invoice_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_invoice_items_created_at ON invoice_items(created_at);

-- Step 3: Add RLS policies for invoice_items
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Users can only access line items for their own invoices
CREATE POLICY "Users can view their own invoice items" ON invoice_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create invoice items for their own invoices" ON invoice_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own invoice items" ON invoice_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own invoice items" ON invoice_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_items.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

-- Step 4: Add calculated_total column to invoices table for line item totals
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' 
    AND column_name = 'calculated_total'
  ) THEN
    ALTER TABLE invoices ADD COLUMN calculated_total DECIMAL(12, 2);
  END IF;
END $$;

-- Step 5: Add is_line_item_invoice flag to distinguish between simple and line item invoices
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' 
    AND column_name = 'is_line_item_invoice'
  ) THEN
    ALTER TABLE invoices ADD COLUMN is_line_item_invoice BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Step 6: Create function to calculate invoice total from line items
CREATE OR REPLACE FUNCTION calculate_invoice_total(invoice_uuid UUID)
RETURNS DECIMAL(12, 2) AS $$
DECLARE
  total DECIMAL(12, 2);
BEGIN
  SELECT COALESCE(SUM(line_total), 0)
  INTO total
  FROM invoice_items
  WHERE invoice_id = invoice_uuid;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create function to update invoice total when line items change
CREATE OR REPLACE FUNCTION update_invoice_calculated_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the calculated total for the affected invoice
  UPDATE invoices
  SET calculated_total = calculate_invoice_total(COALESCE(NEW.invoice_id, OLD.invoice_id))
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create triggers to automatically update calculated totals
DROP TRIGGER IF EXISTS trigger_update_invoice_total_on_item_change ON invoice_items;
CREATE TRIGGER trigger_update_invoice_total_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_calculated_total();

-- Step 9: Create function to get final invoice amount (either amount or calculated_total)
CREATE OR REPLACE FUNCTION get_invoice_final_amount(invoice_uuid UUID)
RETURNS DECIMAL(12, 2) AS $$
DECLARE
  invoice_record RECORD;
  final_amount DECIMAL(12, 2);
BEGIN
  SELECT amount, calculated_total, is_line_item_invoice
  INTO invoice_record
  FROM invoices
  WHERE id = invoice_uuid;
  
  IF invoice_record.is_line_item_invoice THEN
    final_amount := COALESCE(invoice_record.calculated_total, 0);
  ELSE
    final_amount := COALESCE(invoice_record.amount, 0);
  END IF;
  
  RETURN final_amount;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Add updated_at trigger function for invoice_items
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_invoice_items_updated_at ON invoice_items;
CREATE TRIGGER trigger_update_invoice_items_updated_at
  BEFORE UPDATE ON invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 11: Create helpful views for invoice summaries
CREATE OR REPLACE VIEW invoice_summary AS
SELECT 
  i.id,
  i.user_id,
  i.customer_name,
  i.customer_email,
  i.currency,
  i.status,
  i.due_date,
  i.created_at,
  i.is_line_item_invoice,
  i.amount as simple_amount,
  i.calculated_total,
  get_invoice_final_amount(i.id) as final_amount,
  COALESCE((SELECT COUNT(*) FROM invoice_items WHERE invoice_id = i.id), 0) as line_item_count
FROM invoices i;

-- Step 12: Insert sample line items for existing invoices (optional - for testing)
-- This will convert existing invoices to line item format if they have no line items
-- Comment out if you don't want to modify existing data

/*
INSERT INTO invoice_items (invoice_id, description, quantity, unit_price)
SELECT 
  id as invoice_id,
  CASE 
    WHEN customer_name IS NOT NULL THEN 'Service for ' || customer_name
    ELSE 'Professional Service'
  END as description,
  1.00 as quantity,
  amount as unit_price
FROM invoices
WHERE id NOT IN (SELECT DISTINCT invoice_id FROM invoice_items)
  AND amount > 0;

-- Mark these invoices as line item invoices
UPDATE invoices 
SET is_line_item_invoice = TRUE
WHERE id IN (SELECT DISTINCT invoice_id FROM invoice_items);
*/

-- Verification queries
SELECT 'Invoice line items migration completed successfully' as status;

-- Show table structure
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'invoice_items'
ORDER BY ordinal_position;

-- Show sample data structure
SELECT 
  'Sample invoice summary structure:' as info,
  NULL as id,
  NULL as customer_name,
  NULL as final_amount,
  NULL as line_item_count
UNION ALL
SELECT 
  'Invoice data:' as info,
  CAST(id as TEXT),
  customer_name,
  CAST(get_invoice_final_amount(id) as TEXT),
  CAST((SELECT COUNT(*) FROM invoice_items WHERE invoice_id = invoices.id) as TEXT)
FROM invoices
LIMIT 3;