-- Migration: Add LocationType enum and locationType field to CurveDefinition
-- Purpose: Distinguish between hub-level and nodal pricing locations
-- Date: 2025-11-01

-- Step 1: Create the LocationType enum in the Forecasts schema
CREATE TYPE "Forecasts"."LocationType" AS ENUM ('HUB', 'NODE');

-- Step 2: Add the locationType column to CurveDefinition
ALTER TABLE "Forecasts"."CurveDefinition" 
ADD COLUMN "locationType" "Forecasts"."LocationType";

-- Step 3: Populate existing records based on location names
-- NODES: Goleta, Santa Fe Springs, Hidden Lakes, Gunnar, Odessa
UPDATE "Forecasts"."CurveDefinition"
SET "locationType" = 'NODE'
WHERE location IN ('Goleta', 'Santa Fe Springs', 'Hidden Lakes', 'Gunnar', 'Odessa');

-- HUBS: SP15, NP15, Houston South, SPP North Hub, SPP South Hub
UPDATE "Forecasts"."CurveDefinition"
SET "locationType" = 'HUB'
WHERE location IN ('SP15', 'NP15', 'Houston South', 'SPP North Hub', 'SPP South Hub');

-- Also handle any variations in naming for SPP hubs
UPDATE "Forecasts"."CurveDefinition"
SET "locationType" = 'HUB'
WHERE location ILIKE '%north hub%' OR location ILIKE '%south hub%';

-- Set any remaining locations to HUB as default (as stated: "Everything else are hubs")
UPDATE "Forecasts"."CurveDefinition"
SET "locationType" = 'HUB'
WHERE "locationType" IS NULL;

-- Step 4: Create an index on locationType for query performance
CREATE INDEX "idx_curvedefinition_locationtype" ON "Forecasts"."CurveDefinition"("locationType");

-- Step 5: Add a comment to the column for documentation
COMMENT ON COLUMN "Forecasts"."CurveDefinition"."locationType" IS 
'Distinguishes between hub-level (HUB) and nodal (NODE) pricing locations. Used in graphing and analysis to handle location-specific characteristics.';

-- Verification query (commented out - run manually if needed)
-- SELECT location, "locationType", COUNT(*) as count
-- FROM "Forecasts"."CurveDefinition"
-- GROUP BY location, "locationType"
-- ORDER BY location;

