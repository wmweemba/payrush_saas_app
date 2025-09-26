-- Migration: Add multi-currency support to invoices and payments tables
-- Date: 2025-09-26
-- Description: Ensure invoices and payments tables properly support currency fields

-- Step 1: Ensure invoices table has currency column with proper defaults
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' 
    AND column_name = 'currency'
  ) THEN
    ALTER TABLE invoices ADD COLUMN currency VARCHAR(3) DEFAULT 'USD' NOT NULL;
    
    -- Add index for currency queries
    CREATE INDEX IF NOT EXISTS idx_invoices_currency ON invoices(currency);
  ELSE
    -- Ensure existing currency column has proper default
    ALTER TABLE invoices ALTER COLUMN currency SET DEFAULT 'USD';
    ALTER TABLE invoices ALTER COLUMN currency SET NOT NULL;
  END IF;
END $$;

-- Step 2: Add currency constraint to invoices table
ALTER TABLE invoices 
DROP CONSTRAINT IF EXISTS invoices_currency_check;

ALTER TABLE invoices 
ADD CONSTRAINT invoices_currency_check 
CHECK (currency IN ('USD', 'ZMW', 'EUR', 'GBP', 'NGN', 'KES', 'GHS', 'ZAR'));

-- Step 3: Ensure payments table has currency column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' 
    AND column_name = 'currency'
  ) THEN
    ALTER TABLE payments ADD COLUMN currency VARCHAR(3) DEFAULT 'USD' NOT NULL;
    
    -- Add index for currency queries
    CREATE INDEX IF NOT EXISTS idx_payments_currency ON payments(currency);
  ELSE
    -- Ensure existing currency column has proper default
    ALTER TABLE payments ALTER COLUMN currency SET DEFAULT 'USD';
    ALTER TABLE payments ALTER COLUMN currency SET NOT NULL;
  END IF;
END $$;

-- Step 4: Add currency constraint to payments table
ALTER TABLE payments 
DROP CONSTRAINT IF EXISTS payments_currency_check;

ALTER TABLE payments 
ADD CONSTRAINT payments_currency_check 
CHECK (currency IN ('USD', 'ZMW', 'EUR', 'GBP', 'NGN', 'KES', 'GHS', 'ZAR'));

-- Step 5: Update existing invoices with USD currency if NULL
UPDATE invoices 
SET currency = 'USD' 
WHERE currency IS NULL;

-- Step 6: Update existing payments with USD currency if NULL
UPDATE payments 
SET currency = 'USD' 
WHERE currency IS NULL;

-- Step 7: Add exchange rate tracking table for future use
CREATE TABLE IF NOT EXISTS exchange_rates (
  id SERIAL PRIMARY KEY,
  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(10, 6) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT exchange_rates_currencies_check 
    CHECK (from_currency IN ('USD', 'ZMW', 'EUR', 'GBP', 'NGN', 'KES', 'GHS', 'ZAR')
           AND to_currency IN ('USD', 'ZMW', 'EUR', 'GBP', 'NGN', 'KES', 'GHS', 'ZAR')),
  UNIQUE(from_currency, to_currency, date)
);

-- Add indexes for exchange rates
CREATE INDEX IF NOT EXISTS idx_exchange_rates_from_currency ON exchange_rates(from_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_to_currency ON exchange_rates(to_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates(date);

-- Step 8: Insert default exchange rates (base: USD)
INSERT INTO exchange_rates (from_currency, to_currency, rate) VALUES
  ('USD', 'USD', 1.000000),
  ('USD', 'ZMW', 24.500000), -- 1 USD = 24.50 ZMW
  ('USD', 'EUR', 0.850000),  -- 1 USD = 0.85 EUR
  ('USD', 'GBP', 0.730000),  -- 1 USD = 0.73 GBP
  ('USD', 'NGN', 800.000000), -- 1 USD = 800 NGN
  ('USD', 'KES', 110.000000), -- 1 USD = 110 KES
  ('USD', 'GHS', 12.000000),  -- 1 USD = 12 GHS
  ('USD', 'ZAR', 18.500000),  -- 1 USD = 18.50 ZAR
  
  -- Reverse rates (approximate)
  ('ZMW', 'USD', 0.040816), -- 1 ZMW = 0.041 USD
  ('EUR', 'USD', 1.176471), -- 1 EUR = 1.18 USD
  ('GBP', 'USD', 1.369863), -- 1 GBP = 1.37 USD
  ('NGN', 'USD', 0.001250), -- 1 NGN = 0.00125 USD
  ('KES', 'USD', 0.009091), -- 1 KES = 0.009 USD
  ('GHS', 'USD', 0.083333), -- 1 GHS = 0.083 USD
  ('ZAR', 'USD', 0.054054)  -- 1 ZAR = 0.054 USD
ON CONFLICT (from_currency, to_currency, date) DO NOTHING;

-- Step 9: Add currency display preferences to profiles table
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'default_currency'
  ) THEN
    ALTER TABLE profiles ADD COLUMN default_currency VARCHAR(3) DEFAULT 'USD' NOT NULL;
    
    -- Add constraint for profile default currency
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_default_currency_check 
    CHECK (default_currency IN ('USD', 'ZMW', 'EUR', 'GBP', 'NGN', 'KES', 'GHS', 'ZAR'));
  END IF;
END $$;

-- Step 10: Add RLS policies for exchange_rates table
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read exchange rates
CREATE POLICY "Exchange rates are viewable by everyone" ON exchange_rates
  FOR SELECT USING (true);

-- Only authenticated users can update exchange rates (future admin feature)
CREATE POLICY "Exchange rates are updatable by authenticated users" ON exchange_rates
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Verification queries
SELECT 'Multi-currency migration completed successfully' as status;

-- Check table structures
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name IN ('invoices', 'payments', 'profiles', 'exchange_rates')
  AND column_name LIKE '%currency%'
ORDER BY table_name, column_name;