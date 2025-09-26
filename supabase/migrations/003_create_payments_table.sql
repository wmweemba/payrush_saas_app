-- Migration: Create payments table for transaction records
-- Date: 2025-09-26
-- Description: Create payments table to store Flutterwave transaction records and link to invoices

-- Step 1: Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'successful', 'failed', 'cancelled')),
  reference VARCHAR(100) NOT NULL UNIQUE, -- Flutterwave transaction reference
  flutterwave_id VARCHAR(100), -- Flutterwave transaction ID
  payment_method VARCHAR(50), -- card, mobile_money, bank_transfer, etc.
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT payments_reference_unique UNIQUE(reference)
);

-- Step 2: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Step 3: Set up Row Level Security (RLS)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
-- Allow users to view their own payments through invoice ownership
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = payments.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

-- Allow users to insert payments for their own invoices
CREATE POLICY "Users can create payments for their invoices" ON payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = payments.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

-- Allow users to update payments for their own invoices
CREATE POLICY "Users can update their own payments" ON payments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = payments.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

-- Step 5: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger for updated_at
CREATE TRIGGER payments_updated_at_trigger
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_payments_updated_at();

-- Verification queries
-- SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name = 'payments' ORDER BY ordinal_position;
-- SELECT * FROM payments LIMIT 1;