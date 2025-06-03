-- =====================================================
-- Update CurveInstanceData Table Structure
-- =====================================================
-- This script updates the PriceForecast table (which will be renamed to CurveInstanceData)
-- to better support P-value confidence intervals with granularity specification
-- and removes the deprecated valueHigh/valueLow fields in favor of proper P-values

BEGIN;

-- Create enum for P-value granularity if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "Forecasts"."PValueGranularity" AS ENUM (
        'HOURLY',      -- P-values calculated over hourly windows
        'DAILY',       -- P-values calculated over daily windows  
        'WEEKLY',      -- P-values calculated over weekly windows
        'MONTHLY',     -- P-values calculated over monthly windows
        'QUARTERLY',   -- P-values calculated over quarterly windows
        'YEARLY',      -- P-values calculated over yearly windows
        'ROLLING_7D',  -- Rolling 7-day window
        'ROLLING_30D', -- Rolling 30-day window
        'ROLLING_90D', -- Rolling 90-day window
        'SEASONAL'     -- Seasonal patterns (e.g., summer vs winter)
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add pValueGranularity column to PriceForecast table
ALTER TABLE "Forecasts"."PriceForecast" 
ADD COLUMN IF NOT EXISTS "pValueGranularity" "Forecasts"."PValueGranularity" DEFAULT 'MONTHLY';

-- Add comment explaining the new field
COMMENT ON COLUMN "Forecasts"."PriceForecast"."pValueGranularity" IS 
'Specifies the time window over which the P-value confidence intervals (valueP90, valueP10) were calculated. For example, MONTHLY means the P90/P10 values represent the 90th/10th percentiles of prices over monthly periods.';

-- Remove deprecated valueHigh and valueLow columns
-- These are replaced by the more precise valueP90/valueP10 with granularity specification
ALTER TABLE "Forecasts"."PriceForecast" 
DROP COLUMN IF EXISTS "valueHigh";

ALTER TABLE "Forecasts"."PriceForecast" 
DROP COLUMN IF EXISTS "valueLow";

-- Update comments on existing P-value columns for clarity
COMMENT ON COLUMN "Forecasts"."PriceForecast"."valueP90" IS 
'90th percentile value calculated over the time window specified by pValueGranularity. Represents optimistic/bullish scenario.';

COMMENT ON COLUMN "Forecasts"."PriceForecast"."valueP10" IS 
'10th percentile value calculated over the time window specified by pValueGranularity. Represents pessimistic/bearish scenario.';

COMMENT ON COLUMN "Forecasts"."PriceForecast"."flags" IS 
'Array of data quality flags such as ["outlier", "holiday", "estimated", "peak_hour", "high_demand"]. Used to mark special conditions or data reliability notes.';

-- Add index for efficient querying by granularity
CREATE INDEX IF NOT EXISTS "idx_priceforecast_pvalue_granularity" 
ON "Forecasts"."PriceForecast" ("pValueGranularity");

-- Add composite index for common query patterns
CREATE INDEX IF NOT EXISTS "idx_priceforecast_instance_timestamp_granularity" 
ON "Forecasts"."PriceForecast" ("curveInstanceId", "timestamp", "pValueGranularity");

COMMIT;

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check the updated table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'PriceForecast' 
    AND table_schema = 'Forecasts'
ORDER BY ordinal_position;

-- Verify enum values
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'PValueGranularity' 
        AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'Forecasts')
)
ORDER BY enumsortorder;

-- Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'PriceForecast' 
    AND schemaname = 'Forecasts'
    AND indexname LIKE '%granularity%'; 