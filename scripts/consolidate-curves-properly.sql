-- Proper Curve Consolidation Script
-- Creates ONE CurveDefinition per conceptual curve with MULTIPLE CurveInstances

BEGIN;

-- ========== STEP 1: CREATE CONSOLIDATION MAPPING ==========

-- Create mapping table to track consolidation
CREATE TEMP TABLE consolidation_map AS
WITH curve_groups AS (
    SELECT 
        UPPER(CONCAT(
            COALESCE(market, 'UNKNOWN'), '_',
            COALESCE(mark_type, 'TYPE'), '_',
            REPLACE(COALESCE(location, 'LOC'), ' ', '_')
        )) as conceptual_curve,
        curve_id,
        market,
        mark_type,
        location,
        granularity,
        mark_case,
        mark_model_type_desc,
        value_type,
        curve_creator,
        created_at,
        mark_date
    FROM "Forecasts".curve_definitions
),
primary_selection AS (
    SELECT DISTINCT
        conceptual_curve,
        -- Select the curve with most price data as primary, or oldest if no prices
        FIRST_VALUE(curve_id) OVER (
            PARTITION BY conceptual_curve 
            ORDER BY price_count DESC NULLS LAST, created_at ASC
        ) as primary_curve_id
    FROM (
        SELECT 
            cg.*,
            COUNT(pf.curve_id) as price_count
        FROM curve_groups cg
        LEFT JOIN "Forecasts".price_forecasts pf ON cg.curve_id = pf.curve_id
        GROUP BY cg.conceptual_curve, cg.curve_id, cg.market, cg.mark_type, 
                 cg.location, cg.granularity, cg.mark_case, cg.mark_model_type_desc,
                 cg.value_type, cg.curve_creator, cg.created_at, cg.mark_date
    ) t
)
SELECT 
    cg.*,
    ps.primary_curve_id,
    CASE WHEN cg.curve_id = ps.primary_curve_id THEN 'PRIMARY' ELSE 'VARIANT' END as role,
    ROW_NUMBER() OVER (PARTITION BY cg.conceptual_curve ORDER BY cg.created_at) as variant_number
FROM curve_groups cg
JOIN primary_selection ps ON cg.conceptual_curve = ps.conceptual_curve;

-- Show consolidation plan
DO $$
DECLARE
    v_unique_curves INTEGER;
    v_total_curves INTEGER;
    v_variants INTEGER;
BEGIN
    SELECT COUNT(DISTINCT conceptual_curve) INTO v_unique_curves FROM consolidation_map;
    SELECT COUNT(*) INTO v_total_curves FROM consolidation_map;
    SELECT COUNT(*) INTO v_variants FROM consolidation_map WHERE role = 'VARIANT';
    
    RAISE NOTICE '';
    RAISE NOTICE '===== CONSOLIDATION PLAN =====';
    RAISE NOTICE 'Total curves: %', v_total_curves;
    RAISE NOTICE 'Unique conceptual curves: %', v_unique_curves;
    RAISE NOTICE 'Variants to become instances: %', v_variants;
    RAISE NOTICE '';
END $$;

-- Display consolidation groups
SELECT 
    conceptual_curve,
    COUNT(*) as total_variants,
    COUNT(*) FILTER (WHERE role = 'PRIMARY') as primary_count,
    COUNT(*) FILTER (WHERE role = 'VARIANT') as variant_count,
    STRING_AGG(
        CONCAT('ID:', curve_id, ' (', granularity, ')'), 
        ', ' 
        ORDER BY variant_number
    ) as curve_details
FROM consolidation_map
GROUP BY conceptual_curve
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC
LIMIT 10;

-- ========== STEP 2: CREATE NEW ARCHITECTURE TABLES IF NEEDED ==========

-- This assumes the migration hasn't run yet, so we create the tables here
-- If migration already ran, this will be skipped

-- Create ENUMs if they don't exist
DO $$
BEGIN
    CREATE TYPE "InstanceStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'SUPERSEDED', 'EXPIRED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "RunType" AS ENUM ('SCHEDULED', 'MANUAL', 'TRIGGERED', 'BACKFILL', 'CORRECTION');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Continue with other ENUMs...
-- (Including all ENUMs from the migration script)

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS "CurveDefinition" (
    "id" SERIAL PRIMARY KEY,
    "curveName" VARCHAR(255) UNIQUE NOT NULL,
    "market" VARCHAR(50) NOT NULL,
    "location" VARCHAR(100) NOT NULL,
    "product" VARCHAR(50) NOT NULL,
    "commodity" VARCHAR(50) NOT NULL,
    "units" VARCHAR(50) NOT NULL,
    "granularity" VARCHAR(20) NOT NULL,
    "timezone" VARCHAR(50) DEFAULT 'UTC',
    "description" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create other tables...
-- (Continue with full schema from migration)

-- ========== STEP 3: MIGRATE PRIMARY CURVES TO CurveDefinition ==========

INSERT INTO "CurveDefinition" (
    "curveName",
    "market",
    "location",
    "product",
    "commodity",
    "units",
    "granularity",
    "timezone",
    "description",
    "isActive",
    "metadata"
)
SELECT 
    cm.conceptual_curve as "curveName",
    cd.market,
    cd.location,
    COALESCE(cd.mark_type, 'UNKNOWN') as "product",
    'Energy' as "commodity",
    '$/MWh' as "units",
    -- Use most common granularity for the definition
    MODE() WITHIN GROUP (ORDER BY cm2.granularity) as "granularity",
    CASE 
        WHEN cd.market = 'CAISO' THEN 'America/Los_Angeles'
        WHEN cd.market = 'ERCOT' THEN 'America/Chicago'
        ELSE 'UTC'
    END as "timezone",
    CONCAT('Consolidated curve: ', cd.mark_type, ' - ', cd.location) as "description",
    true as "isActive",
    jsonb_build_object(
        'consolidation_date', CURRENT_TIMESTAMP,
        'primary_legacy_id', cm.primary_curve_id,
        'variant_count', COUNT(DISTINCT cm2.curve_id),
        'granularities', jsonb_agg(DISTINCT cm2.granularity),
        'legacy_creators', jsonb_agg(DISTINCT cm2.curve_creator)
    ) as "metadata"
FROM consolidation_map cm
JOIN "Forecasts".curve_definitions cd ON cd.curve_id = cm.primary_curve_id
JOIN consolidation_map cm2 ON cm2.conceptual_curve = cm.conceptual_curve
WHERE cm.role = 'PRIMARY'
GROUP BY cm.conceptual_curve, cm.primary_curve_id, cd.market, cd.location, cd.mark_type;

-- ========== STEP 4: CREATE CurveInstances FOR ALL VARIANTS ==========

-- Create instances for each variant (including primary)
INSERT INTO "CurveInstance" (
    "curve_definition_id",
    "instanceVersion",
    "deliveryPeriodStart",
    "deliveryPeriodEnd",
    "forecastRunDate",
    "freshnessStartDate",
    "freshnessEndDate",
    "status",
    "modelType",
    "runType",
    "createdBy",
    "notes",
    "metadata"
)
SELECT 
    cdef.id as "curve_definition_id",
    CONCAT('legacy_', cm.granularity, '_v', cm.variant_number) as "instanceVersion",
    COALESCE(pf_range.min_date, cd.created_at::date) as "deliveryPeriodStart",
    COALESCE(pf_range.max_date, (cd.created_at + INTERVAL '1 year')::date) as "deliveryPeriodEnd",
    COALESCE(cd.mark_date, cd.created_at) as "forecastRunDate",
    COALESCE(cd.mark_date, cd.created_at) as "freshnessStartDate",
    NULL as "freshnessEndDate", -- Still active
    'ACTIVE'::"InstanceStatus" as "status",
    COALESCE(cd.mark_model_type_desc, 'Historical') as "modelType",
    'BACKFILL'::"RunType" as "runType",
    'consolidation_script' as "createdBy",
    CONCAT('Migrated from legacy curve_id: ', cm.curve_id, 
           CASE WHEN cm.role = 'VARIANT' THEN ' (variant)' ELSE ' (primary)' END) as "notes",
    jsonb_build_object(
        'legacy_curve_id', cm.curve_id,
        'legacy_granularity', cm.granularity,
        'legacy_mark_case', cm.mark_case,
        'legacy_role', cm.role,
        'has_price_data', COALESCE(pf_range.price_count, 0) > 0
    ) as "metadata"
FROM consolidation_map cm
JOIN "Forecasts".curve_definitions cd ON cd.curve_id = cm.curve_id
JOIN "CurveDefinition" cdef ON cdef."curveName" = cm.conceptual_curve
LEFT JOIN LATERAL (
    SELECT 
        COUNT(*) as price_count,
        MIN(flow_date_start) as min_date,
        MAX(flow_date_start) as max_date
    FROM "Forecasts".price_forecasts
    WHERE curve_id = cm.curve_id
) pf_range ON true;

-- ========== STEP 5: CREATE LEGACY MAPPING TABLE ==========

CREATE TABLE IF NOT EXISTS "LegacyCurveMapping" (
    "id" SERIAL PRIMARY KEY,
    "oldCurveId" INTEGER UNIQUE NOT NULL,
    "newCurveDefinitionId" INTEGER NOT NULL,
    "newCurveInstanceId" INTEGER NOT NULL,
    "migrationNotes" TEXT,
    "migratedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Populate mapping
INSERT INTO "LegacyCurveMapping" (
    "oldCurveId",
    "newCurveDefinitionId",
    "newCurveInstanceId",
    "migrationNotes"
)
SELECT 
    cm.curve_id,
    cdef.id,
    ci.id,
    CONCAT('Role: ', cm.role, ', Granularity: ', cm.granularity)
FROM consolidation_map cm
JOIN "CurveDefinition" cdef ON cdef."curveName" = cm.conceptual_curve
JOIN "CurveInstance" ci ON ci."curve_definition_id" = cdef.id
    AND ci."metadata"->>'legacy_curve_id' = cm.curve_id::text;

-- ========== STEP 6: MIGRATE PRICE DATA ==========

-- Migrate all price forecasts to new structure
INSERT INTO "PriceForecast" (
    "curve_instance_id",
    "timestamp",
    "value"
)
SELECT 
    lcm."newCurveInstanceId",
    pf.flow_date_start,
    pf.value
FROM "Forecasts".price_forecasts pf
JOIN "LegacyCurveMapping" lcm ON lcm."oldCurveId" = pf.curve_id;

-- ========== STEP 7: VERIFICATION ==========

DO $$
DECLARE
    v_definitions INTEGER;
    v_instances INTEGER;
    v_prices_old INTEGER;
    v_prices_new INTEGER;
    v_mappings INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_definitions FROM "CurveDefinition";
    SELECT COUNT(*) INTO v_instances FROM "CurveInstance";
    SELECT COUNT(*) INTO v_prices_old FROM "Forecasts".price_forecasts;
    SELECT COUNT(*) INTO v_prices_new FROM "PriceForecast";
    SELECT COUNT(*) INTO v_mappings FROM "LegacyCurveMapping";
    
    RAISE NOTICE '';
    RAISE NOTICE '===== CONSOLIDATION RESULTS =====';
    RAISE NOTICE 'CurveDefinitions created: %', v_definitions;
    RAISE NOTICE 'CurveInstances created: %', v_instances;
    RAISE NOTICE 'Legacy mappings: %', v_mappings;
    RAISE NOTICE 'Price records migrated: % of %', v_prices_new, v_prices_old;
    
    IF v_prices_new != v_prices_old THEN
        RAISE WARNING 'Price count mismatch! Check for errors.';
    END IF;
END $$;

-- Show sample of consolidated data
SELECT 
    cd."curveName",
    cd."market",
    cd."location",
    cd."granularity" as definition_granularity,
    COUNT(DISTINCT ci.id) as instance_count,
    COUNT(DISTINCT pf.id) as price_count,
    STRING_AGG(DISTINCT ci."metadata"->>'legacy_granularity', ', ') as instance_granularities
FROM "CurveDefinition" cd
JOIN "CurveInstance" ci ON ci."curve_definition_id" = cd.id
LEFT JOIN "PriceForecast" pf ON pf."curve_instance_id" = ci.id
GROUP BY cd."curveName", cd."market", cd."location", cd."granularity"
ORDER BY instance_count DESC
LIMIT 10;

COMMIT;

RAISE NOTICE 'Consolidation complete! Each conceptual curve now has one definition with multiple instances.'; 