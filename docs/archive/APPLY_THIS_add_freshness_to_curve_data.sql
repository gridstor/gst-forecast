-- Migration: Add Freshness Tracking to CurveData Level
-- Purpose: Enable different freshness periods for different curve types/commodities within the same instance
-- Date: October 31, 2025

-- Add freshness columns to CurveData table
ALTER TABLE "Forecasts"."CurveData"
ADD COLUMN IF NOT EXISTS "freshnessStartDate" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "freshnessEndDate" TIMESTAMPTZ;

-- Create index for freshness queries
CREATE INDEX IF NOT EXISTS "idx_curvedata_freshness" 
ON "Forecasts"."CurveData"("freshnessStartDate", "freshnessEndDate");

-- Create composite index for finding fresh curves by type/commodity
CREATE INDEX IF NOT EXISTS "idx_curvedata_fresh_by_type" 
ON "Forecasts"."CurveData"("curveType", "commodity", "freshnessStartDate", "freshnessEndDate");

-- OPTIONAL: Migrate existing instance-level freshness to curve data level
-- This copies the instance freshness dates to all curve data rows for that instance
UPDATE "Forecasts"."CurveData" cd
SET 
  "freshnessStartDate" = ci."freshnessStartDate",
  "freshnessEndDate" = ci."freshnessEndDate"
FROM "Forecasts"."CurveInstance" ci
WHERE cd."curveInstanceId" = ci.id
  AND cd."freshnessStartDate" IS NULL;

-- Add comment explaining the schema change
COMMENT ON COLUMN "Forecasts"."CurveData"."freshnessStartDate" IS 
  'Start date when this specific curve data (curve type + commodity combination) became/becomes the current/fresh data';

COMMENT ON COLUMN "Forecasts"."CurveData"."freshnessEndDate" IS 
  'End date when this curve data was/will be superseded by newer data. NULL means currently fresh/active';

-- Verify the changes
SELECT 
  'CurveData freshness columns added' as status,
  COUNT(*) as total_rows,
  COUNT("freshnessStartDate") as rows_with_freshness_start,
  COUNT("freshnessEndDate") as rows_with_freshness_end
FROM "Forecasts"."CurveData";

-- Show example of fresh vs archived data
SELECT 
  cd.id,
  cd."curveType",
  cd.commodity,
  cd."freshnessStartDate",
  cd."freshnessEndDate",
  CASE 
    WHEN cd."freshnessEndDate" IS NULL OR cd."freshnessEndDate" > CURRENT_TIMESTAMP 
    THEN 'CURRENT/FRESH'
    ELSE 'ARCHIVED'
  END as freshness_status
FROM "Forecasts"."CurveData" cd
ORDER BY cd."freshnessStartDate" DESC
LIMIT 20;

-- SUCCESS CRITERIA:
-- ✓ freshnessStartDate column exists on CurveData
-- ✓ freshnessEndDate column exists on CurveData
-- ✓ Indexes created for performance
-- ✓ Existing data migrated from instance level
-- ✓ Can query fresh data by curve type + commodity

