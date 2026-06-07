ALTER TABLE payrush.invoices
  ADD COLUMN IF NOT EXISTS document_type text NOT NULL DEFAULT 'invoice',
  ADD COLUMN IF NOT EXISTS converted_from_quote_id uuid
    REFERENCES payrush.invoices(id) ON DELETE SET NULL;

-- Add check constraint for valid document types
ALTER TABLE payrush.invoices
  ADD CONSTRAINT invoices_document_type_check
  CHECK (document_type IN ('invoice', 'quote'));
