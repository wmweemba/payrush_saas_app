-- Migration: Add Payment Tracking Fields to Invoices Table
-- Description: Add sent_at and paid_at timestamp fields for better invoice lifecycle tracking
-- Author: PayRush Development Team
-- Date: 2025-11-10

-- ==============================================================================
-- STEP 1: Add Payment Tracking Fields to Invoices Table
-- ==============================================================================

-- Function to safely add columns only if they don't exist
DO $$ 
DECLARE
    column_exists boolean;
BEGIN
    -- Check and add sent_at column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'sent_at'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE invoices ADD COLUMN sent_at TIMESTAMPTZ;
        RAISE NOTICE 'Added sent_at column to invoices table';
    ELSE
        RAISE NOTICE 'sent_at column already exists in invoices table';
    END IF;
    
    -- Check and add paid_at column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'paid_at'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE invoices ADD COLUMN paid_at TIMESTAMPTZ;
        RAISE NOTICE 'Added paid_at column to invoices table';
    ELSE
        RAISE NOTICE 'paid_at column already exists in invoices table';
    END IF;
    
    -- Check and add payment_method column for tracking how payment was made
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'payment_method'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE invoices ADD COLUMN payment_method VARCHAR(50) CHECK (
            payment_method IS NULL OR 
            payment_method IN ('manual', 'bank_transfer', 'card', 'mobile_money', 'cash', 'check', 'other')
        );
        RAISE NOTICE 'Added payment_method column to invoices table';
    ELSE
        RAISE NOTICE 'payment_method column already exists in invoices table';
    END IF;
    
    -- Check and add payment_reference column for tracking payment references
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'payment_reference'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE invoices ADD COLUMN payment_reference TEXT;
        RAISE NOTICE 'Added payment_reference column to invoices table';
    ELSE
        RAISE NOTICE 'payment_reference column already exists in invoices table';
    END IF;
    
    -- Check and add payment_notes column for additional payment information
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'payment_notes'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE invoices ADD COLUMN payment_notes TEXT;
        RAISE NOTICE 'Added payment_notes column to invoices table';
    ELSE
        RAISE NOTICE 'payment_notes column already exists in invoices table';
    END IF;
END $$;

-- ==============================================================================
-- STEP 2: Create Indexes for Performance
-- ==============================================================================

-- Index for sent_at queries
CREATE INDEX IF NOT EXISTS idx_invoices_sent_at ON invoices(sent_at);

-- Index for paid_at queries
CREATE INDEX IF NOT EXISTS idx_invoices_paid_at ON invoices(paid_at);

-- Composite index for status and payment tracking
CREATE INDEX IF NOT EXISTS idx_invoices_status_dates ON invoices(status, sent_at, paid_at);

-- Index for payment method queries
CREATE INDEX IF NOT EXISTS idx_invoices_payment_method ON invoices(payment_method) WHERE payment_method IS NOT NULL;

-- ==============================================================================
-- STEP 3: Add Column Comments for Documentation
-- ==============================================================================

COMMENT ON COLUMN invoices.sent_at IS 'Timestamp when invoice was sent to client via email';
COMMENT ON COLUMN invoices.paid_at IS 'Timestamp when invoice was marked as paid';
COMMENT ON COLUMN invoices.payment_method IS 'Method used for payment (manual, bank_transfer, card, etc.)';
COMMENT ON COLUMN invoices.payment_reference IS 'Payment reference number or transaction ID';
COMMENT ON COLUMN invoices.payment_notes IS 'Additional notes about the payment';

-- ==============================================================================
-- STEP 4: Create Function to Update Payment Tracking Automatically
-- ==============================================================================

-- Function to automatically update sent_at when status changes to 'sent'
CREATE OR REPLACE FUNCTION update_invoice_sent_at()
RETURNS TRIGGER AS $$
BEGIN
    -- If status changes to 'sent' and sent_at is null, set it to current timestamp
    IF NEW.status = 'sent' AND OLD.status != 'sent' AND NEW.sent_at IS NULL THEN
        NEW.sent_at = CURRENT_TIMESTAMP;
    END IF;
    
    -- If status changes to 'paid' and paid_at is null, set it to current timestamp
    IF NEW.status = 'paid' AND OLD.status != 'paid' AND NEW.paid_at IS NULL THEN
        NEW.paid_at = CURRENT_TIMESTAMP;
        -- Set default payment method if not specified
        IF NEW.payment_method IS NULL THEN
            NEW.payment_method = 'manual';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update timestamps
DROP TRIGGER IF EXISTS trigger_update_invoice_sent_at ON invoices;
CREATE TRIGGER trigger_update_invoice_sent_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_sent_at();

-- ==============================================================================
-- STEP 5: Verification Query
-- ==============================================================================

-- Display final table structure
DO $$
BEGIN
    RAISE NOTICE 'Invoice table payment tracking columns:';
    RAISE NOTICE '- sent_at: %', (
        SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'sent_at'
    );
    RAISE NOTICE '- paid_at: %', (
        SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'paid_at'
    );
    RAISE NOTICE '- payment_method: %', (
        SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'payment_method'
    );
    RAISE NOTICE '- payment_reference: %', (
        SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'payment_reference'
    );
    RAISE NOTICE '- payment_notes: %', (
        SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'payment_notes'
    );
END $$;