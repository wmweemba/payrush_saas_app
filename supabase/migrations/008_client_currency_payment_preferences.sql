-- Migration: Add client currency and payment preferences
-- Version: 008_client_currency_payment_preferences
-- Date: 2025-09-30

-- Add currency and payment preference columns to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS preferred_currency VARCHAR(3) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS payment_methods JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS auto_currency_conversion BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS currency_updated_at TIMESTAMPTZ DEFAULT now();

-- Create index for currency queries
CREATE INDEX IF NOT EXISTS idx_clients_preferred_currency ON clients(preferred_currency);

-- Add check constraint for valid currency codes
ALTER TABLE clients 
ADD CONSTRAINT chk_preferred_currency 
CHECK (preferred_currency IN ('USD', 'ZMW', 'EUR', 'GBP', 'NGN', 'KES', 'GHS', 'ZAR'));

-- Update existing clients to have default USD currency if null
UPDATE clients 
SET preferred_currency = 'USD', 
    payment_methods = '["card", "bank_transfer"]'::jsonb,
    currency_updated_at = now()
WHERE preferred_currency IS NULL;

-- Create table for currency exchange rates (for future currency conversion)
CREATE TABLE IF NOT EXISTS currency_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_currency VARCHAR(3) NOT NULL,
    to_currency VARCHAR(3) NOT NULL,
    rate DECIMAL(10, 6) NOT NULL,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure unique currency pair per date
    UNIQUE(from_currency, to_currency, effective_date)
);

-- Add RLS policy for currency_rates table
ALTER TABLE currency_rates ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read currency rates
CREATE POLICY "Allow authenticated users to read currency rates" ON currency_rates
    FOR SELECT TO authenticated
    USING (true);

-- Only allow service role to insert/update currency rates
CREATE POLICY "Allow service role to manage currency rates" ON currency_rates
    FOR ALL TO service_role
    USING (true);

-- Create indexes for currency rates
CREATE INDEX IF NOT EXISTS idx_currency_rates_from_to ON currency_rates(from_currency, to_currency);
CREATE INDEX IF NOT EXISTS idx_currency_rates_date ON currency_rates(effective_date DESC);

-- Insert default exchange rates (USD as base)
INSERT INTO currency_rates (from_currency, to_currency, rate, effective_date) VALUES
    ('USD', 'USD', 1.000000, CURRENT_DATE),
    ('USD', 'ZMW', 24.500000, CURRENT_DATE),
    ('USD', 'EUR', 0.850000, CURRENT_DATE),
    ('USD', 'GBP', 0.750000, CURRENT_DATE),
    ('USD', 'NGN', 1580.000000, CURRENT_DATE),
    ('USD', 'KES', 155.000000, CURRENT_DATE),
    ('USD', 'GHS', 15.800000, CURRENT_DATE),
    ('USD', 'ZAR', 18.500000, CURRENT_DATE)
ON CONFLICT (from_currency, to_currency, effective_date) DO NOTHING;

-- Add reverse rates (from other currencies to USD)
INSERT INTO currency_rates (from_currency, to_currency, rate, effective_date) VALUES
    ('ZMW', 'USD', 0.040816, CURRENT_DATE),
    ('EUR', 'USD', 1.176471, CURRENT_DATE),
    ('GBP', 'USD', 1.333333, CURRENT_DATE),
    ('NGN', 'USD', 0.000633, CURRENT_DATE),
    ('KES', 'USD', 0.006452, CURRENT_DATE),
    ('GHS', 'USD', 0.063291, CURRENT_DATE),
    ('ZAR', 'USD', 0.054054, CURRENT_DATE)
ON CONFLICT (from_currency, to_currency, effective_date) DO NOTHING;

-- Create function to get latest exchange rate
CREATE OR REPLACE FUNCTION get_exchange_rate(from_curr VARCHAR(3), to_curr VARCHAR(3))
RETURNS DECIMAL(10, 6) AS $$
DECLARE
    rate_value DECIMAL(10, 6);
BEGIN
    -- If same currency, return 1
    IF from_curr = to_curr THEN
        RETURN 1.000000;
    END IF;
    
    -- Get the latest rate
    SELECT rate INTO rate_value
    FROM currency_rates
    WHERE from_currency = from_curr AND to_currency = to_curr
    ORDER BY effective_date DESC
    LIMIT 1;
    
    -- If no direct rate found, return NULL (will need to implement cross-currency conversion)
    RETURN COALESCE(rate_value, 1.000000);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to convert currency amounts
CREATE OR REPLACE FUNCTION convert_currency(amount DECIMAL, from_curr VARCHAR(3), to_curr VARCHAR(3))
RETURNS DECIMAL(10, 2) AS $$
DECLARE
    rate_value DECIMAL(10, 6);
    converted_amount DECIMAL(10, 2);
BEGIN
    -- Get exchange rate
    rate_value := get_exchange_rate(from_curr, to_curr);
    
    -- Convert amount
    converted_amount := (amount * rate_value)::DECIMAL(10, 2);
    
    RETURN converted_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update clients table constraints and documentation
COMMENT ON COLUMN clients.preferred_currency IS 'Client preferred currency for invoicing and payments';
COMMENT ON COLUMN clients.payment_methods IS 'JSON array of preferred payment methods: ["card", "bank_transfer", "mobile_money", "ussd", "crypto"]';
COMMENT ON COLUMN clients.auto_currency_conversion IS 'Whether to automatically convert invoice amounts to client currency';
COMMENT ON COLUMN clients.currency_updated_at IS 'Timestamp when currency preferences were last updated';

-- Function to update currency_updated_at automatically
CREATE OR REPLACE FUNCTION update_currency_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.preferred_currency IS DISTINCT FROM NEW.preferred_currency OR 
       OLD.payment_methods IS DISTINCT FROM NEW.payment_methods THEN
        NEW.currency_updated_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS trigger_update_currency_timestamp ON clients;
CREATE TRIGGER trigger_update_currency_timestamp
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_currency_timestamp();