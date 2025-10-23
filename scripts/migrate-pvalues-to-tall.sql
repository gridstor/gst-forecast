-- Migration: Restructure PriceForecast from wide to tall p-value format
-- This allows flexible storage of any p-value without predefined columns
-- Run this migration AFTER backing up your database

-- Step 1: Create new tall format table
CREATE TABLE IF NOT EXISTS "Forecasts"."PriceForecastTall" (
  id                SERIAL PRIMARY KEY,
  "curveInstanceId" INT NOT NULL REFERENCES "Forecasts"."CurveInstance"(id) ON DELETE CASCADE,
  "timestamp"       TIMESTAMPTZ NOT NULL,
  "pValue"          INT NOT NULL,  -- The percentile: 5, 25, 50, 75, 95, etc.
  "value"           DOUBLE PRECISION NOT NULL,
  flags             TEXT[] DEFAULT '{}',
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure no duplicate (instance, timestamp, pValue) combinations
  CONSTRAINT uk_instance_timestamp_pvalue UNIQUE ("curveInstanceId", "timestamp", "pValue")
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_priceforecast_tall_instance 
  ON "Forecasts"."PriceForecastTall" ("curveInstanceId");
  
CREATE INDEX IF NOT EXISTS idx_priceforecast_tall_timestamp 
  ON "Forecasts"."PriceForecastTall" ("timestamp");
  
CREATE INDEX IF NOT EXISTS idx_priceforecast_tall_pvalue 
  ON "Forecasts"."PriceForecastTall" ("pValue");
  
CREATE INDEX IF NOT EXISTS idx_priceforecast_tall_instance_timestamp 
  ON "Forecasts"."PriceForecastTall" ("curveInstanceId", "timestamp");

-- Step 3: Migrate data from old wide format to new tall format
-- Only run this if you have existing data in PriceForecast
DO $$
DECLARE
  row_count INT;
BEGIN
  -- Check if old table exists and has data
  SELECT COUNT(*) INTO row_count 
  FROM information_schema.tables 
  WHERE table_schema = 'Forecasts' 
    AND table_name = 'PriceForecast';
  
  IF row_count > 0 THEN
    -- Migrate P5 values
    INSERT INTO "Forecasts"."PriceForecastTall" ("curveInstanceId", "timestamp", "pValue", "value", flags, "createdAt", "updatedAt")
    SELECT "curveInstanceId", "timestamp", 5, "valueP5", flags, NOW(), NOW()
    FROM "Forecasts"."PriceForecast"
    WHERE "valueP5" IS NOT NULL
    ON CONFLICT ("curveInstanceId", "timestamp", "pValue") DO NOTHING;
    
    -- Migrate P25 values
    INSERT INTO "Forecasts"."PriceForecastTall" ("curveInstanceId", "timestamp", "pValue", "value", flags, "createdAt", "updatedAt")
    SELECT "curveInstanceId", "timestamp", 25, "valueP25", flags, NOW(), NOW()
    FROM "Forecasts"."PriceForecast"
    WHERE "valueP25" IS NOT NULL
    ON CONFLICT ("curveInstanceId", "timestamp", "pValue") DO NOTHING;
    
    -- Migrate P50 values (this should always exist)
    INSERT INTO "Forecasts"."PriceForecastTall" ("curveInstanceId", "timestamp", "pValue", "value", flags, "createdAt", "updatedAt")
    SELECT "curveInstanceId", "timestamp", 50, "valueP50", flags, NOW(), NOW()
    FROM "Forecasts"."PriceForecast"
    WHERE "valueP50" IS NOT NULL
    ON CONFLICT ("curveInstanceId", "timestamp", "pValue") DO NOTHING;
    
    -- Migrate P75 values
    INSERT INTO "Forecasts"."PriceForecastTall" ("curveInstanceId", "timestamp", "pValue", "value", flags, "createdAt", "updatedAt")
    SELECT "curveInstanceId", "timestamp", 75, "valueP75", flags, NOW(), NOW()
    FROM "Forecasts"."PriceForecast"
    WHERE "valueP75" IS NOT NULL
    ON CONFLICT ("curveInstanceId", "timestamp", "pValue") DO NOTHING;
    
    -- Migrate P95 values
    INSERT INTO "Forecasts"."PriceForecastTall" ("curveInstanceId", "timestamp", "pValue", "value", flags, "createdAt", "updatedAt")
    SELECT "curveInstanceId", "timestamp", 95, "valueP95", flags, NOW(), NOW()
    FROM "Forecasts"."PriceForecast"
    WHERE "valueP95" IS NOT NULL
    ON CONFLICT ("curveInstanceId", "timestamp", "pValue") DO NOTHING;
    
    RAISE NOTICE 'Data migration completed. Verify the data before dropping old table.';
  END IF;
END $$;

-- Step 4: OPTIONAL - After verifying data, uncomment these lines to complete migration:
-- DROP TABLE IF EXISTS "Forecasts"."PriceForecast" CASCADE;
-- ALTER TABLE "Forecasts"."PriceForecastTall" RENAME TO "PriceForecast";

-- For now, we'll keep both tables and let you verify the migration worked correctly
COMMENT ON TABLE "Forecasts"."PriceForecastTall" IS 
  'Tall format price forecast table - one row per p-value. Allows flexible storage of any percentile without schema changes.';

