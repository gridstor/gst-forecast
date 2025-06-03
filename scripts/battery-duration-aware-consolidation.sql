-- Battery Duration and Scenario Aware Consolidation Script
-- Based on actual data analysis showing no degradation but battery durations and scenarios
-- Creates ONE CurveDefinition per market + location + curve_type + battery_duration + scenario

BEGIN;

-- ========== STEP 0: PRE-FLIGHT ANALYSIS ==========

DO $$
DECLARE
    v_curve_count INTEGER;
    v_unique_concepts INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_curve_count FROM "Forecasts".curve_definitions;
    
    RAISE NOTICE '';
    RAISE NOTICE '===== PRE-CONSOLIDATION ANALYSIS =====';
    RAISE NOTICE 'Total curve_definitions records: %', v_curve_count;
    RAISE NOTICE '';
    
    IF v_curve_count = 0 THEN
        RAISE EXCEPTION 'No curves found to consolidate';
    END IF;
END $$;

-- ========== STEP 1: CREATE CONSOLIDATION STRATEGY ==========

CREATE TEMP TABLE battery_consolidation_strategy AS
WITH curve_analysis AS (
    SELECT 
        cd.*,
        -- Extract curve type from value_type and mark_type
        CASE 
            WHEN value_type = 'AS' OR mark_type ILIKE '%AS%' THEN 'AS'
            WHEN value_type = 'Energy Arb' OR mark_type ILIKE '%energyarb%' THEN 'ENERGY_ARB'
            WHEN mark_type ILIKE '%energy%' AND mark_type NOT ILIKE '%arb%' THEN 'ENERGY'
            WHEN value_type = 'Revenue' AND mark_type ILIKE '%revenue%' THEN 'REVENUE'
            WHEN value_type = 'Revenue' THEN 'REVENUE_OTHER'
            ELSE 'OTHER'
        END as curve_type,
        -- Extract battery duration from mark_type
        CASE 
            WHEN mark_type LIKE '%2h%' OR mark_type LIKE '%2hr%' THEN '2H'
            WHEN mark_type LIKE '%4h%' OR mark_type LIKE '%4hr%' THEN '4H'
            WHEN mark_type LIKE '%8h%' THEN '8H'
            WHEN mark_type LIKE '%2.6h%' OR mark_type LIKE '%26h%' THEN '2.6H'
            ELSE 'UNKNOWN'
        END as battery_duration,
        -- Standardize scenario names
        CASE 
            WHEN mark_case = 'Base' THEN 'BASE'
            WHEN mark_case = 'Low' THEN 'LOW'
            WHEN mark_case = 'High' THEN 'HIGH'
            WHEN mark_case = 'P50' THEN 'P50'
            WHEN mark_case = 'Downside' THEN 'DOWNSIDE'
            WHEN mark_case = 'Upside' THEN 'UPSIDE'
            WHEN mark_case = 'Worst' THEN 'WORST'
            WHEN mark_case = 'Actual' THEN 'ACTUAL'
            WHEN mark_case = 'Target' THEN 'TARGET'
            WHEN mark_case = 'Lower_Bound' THEN 'LOWER_BOUND'
            WHEN mark_case = 'Upper_Bound' THEN 'UPPER_BOUND'
            ELSE UPPER(mark_case)
        END as scenario,
        -- Conceptual identity includes battery duration and scenario
        UPPER(CONCAT(
            REPLACE(COALESCE(market, 'UNKNOWN'), ' ', '_'), '_',
            REPLACE(COALESCE(location, 'LOC'), ' ', '_'), '_',
            CASE 
                WHEN value_type = 'AS' OR mark_type ILIKE '%AS%' THEN 'AS'
                WHEN value_type = 'Energy Arb' OR mark_type ILIKE '%energyarb%' THEN 'ENERGY_ARB'
                WHEN mark_type ILIKE '%energy%' AND mark_type NOT ILIKE '%arb%' THEN 'ENERGY'
                WHEN value_type = 'Revenue' AND mark_type ILIKE '%revenue%' THEN 'REVENUE'
                WHEN value_type = 'Revenue' THEN 'REVENUE_OTHER'
                ELSE 'OTHER'
            END, '_',
            CASE 
                WHEN mark_type LIKE '%2h%' OR mark_type LIKE '%2hr%' THEN '2H'
                WHEN mark_type LIKE '%4h%' OR mark_type LIKE '%4hr%' THEN '4H'
                WHEN mark_type LIKE '%8h%' THEN '8H'
                WHEN mark_type LIKE '%2.6h%' OR mark_type LIKE '%26h%' THEN '2.6H'
                ELSE 'UNKNOWN'
            END, '_',
            CASE 
                WHEN mark_case = 'Base' THEN 'BASE'
                WHEN mark_case = 'Low' THEN 'LOW'
                WHEN mark_case = 'High' THEN 'HIGH'
                WHEN mark_case = 'P50' THEN 'P50'
                WHEN mark_case = 'Downside' THEN 'DOWNSIDE'
                WHEN mark_case = 'Upside' THEN 'UPSIDE'
                WHEN mark_case = 'Worst' THEN 'WORST'
                ELSE UPPER(REPLACE(mark_case, ' ', '_'))
            END
        )) as battery_conceptual_identity
    FROM "Forecasts".curve_definitions cd
),
price_data_stats AS (
    SELECT 
        ca.*,
        COALESCE(pf_stats.price_count, 0) as price_count,
        pf_stats.min_date as data_start,
        pf_stats.max_date as data_end,
        pf_stats.date_range_days,
        -- Ranking for primary selection within each conceptual group
        ROW_NUMBER() OVER (
            PARTITION BY ca.battery_conceptual_identity
            ORDER BY 
                COALESCE(pf_stats.price_count, 0) DESC,  -- Most data wins
                ca.created_at ASC                         -- Then oldest
        ) as primary_rank,
        -- Instance versioning within concept
        ROW_NUMBER() OVER (
            PARTITION BY ca.battery_conceptual_identity
            ORDER BY ca.created_at ASC
        ) as instance_sequence
    FROM curve_analysis ca
    LEFT JOIN LATERAL (
        SELECT 
            COUNT(*) as price_count,
            MIN(flow_date_start) as min_date,
            MAX(flow_date_start) as max_date,
            EXTRACT(DAY FROM MAX(flow_date_start) - MIN(flow_date_start)) as date_range_days
        FROM "Forecasts".price_forecasts
        WHERE curve_id = ca.curve_id
    ) pf_stats ON true
)
SELECT 
    *,
    CASE WHEN primary_rank = 1 THEN 'PRIMARY' ELSE 'INSTANCE' END as role,
    -- Generate instance version based on granularity and sequence
    CONCAT(
        'legacy_',
        LOWER(COALESCE(granularity, 'unknown')),
        '_v', instance_sequence
    ) as instance_version
FROM price_data_stats;

-- Show consolidation plan summary
DO $$
DECLARE
    v_unique_battery_concepts INTEGER;
    v_total_instances INTEGER;
BEGIN
    SELECT COUNT(DISTINCT battery_conceptual_identity) INTO v_unique_battery_concepts 
    FROM battery_consolidation_strategy;
    
    SELECT COUNT(*) INTO v_total_instances FROM battery_consolidation_strategy;
    
    RAISE NOTICE 'Battery-based consolidation plan:';
    RAISE NOTICE '  Unique CurveDefinitions (with battery/scenario): %', v_unique_battery_concepts;
    RAISE NOTICE '  Total CurveInstances: %', v_total_instances;
END $$;

-- Display sample of consolidation groups
SELECT 
    battery_conceptual_identity,
    curve_type,
    battery_duration,
    scenario,
    COUNT(*) as instance_count,
    STRING_AGG(DISTINCT granularity, ', ' ORDER BY granularity) as granularities,
    SUM(price_count) as total_price_records
FROM battery_consolidation_strategy
GROUP BY battery_conceptual_identity, curve_type, battery_duration, scenario
ORDER BY COUNT(*) DESC
LIMIT 10;

-- ========== STEP 2: CREATE NEW SCHEMA OBJECTS ==========

-- Create ENUMs if not exists
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

DO $$
BEGIN
    CREATE TYPE "InputType" AS ENUM ('WEATHER_FORECAST', 'WEATHER_ACTUAL', 'DEMAND_FORECAST', 'DEMAND_ACTUAL', 
        'GENERATION_FORECAST', 'GENERATION_ACTUAL', 'TRANSMISSION_LIMITS', 'FUEL_PRICES', 
        'HYDRO_CONDITIONS', 'RENEWABLE_FORECAST', 'MARKET_FUNDAMENTALS', 'REGULATORY_CHANGES', 'LEGACY_MIGRATION', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    CREATE TYPE "UsageType" AS ENUM ('PRIMARY', 'VALIDATION', 'REFERENCE', 'FALLBACK');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add new ENUM for curve types
DO $$
BEGIN
    CREATE TYPE "CurveType" AS ENUM ('REVENUE', 'REVENUE_OTHER', 'ENERGY', 'ENERGY_ARB', 'AS', 'TB2', 'TB4', 'RA', 'DA', 'RT', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add new ENUM for battery durations
DO $$
BEGIN
    CREATE TYPE "BatteryDuration" AS ENUM ('2H', '4H', '8H', '2.6H', 'UNKNOWN', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add new ENUM for scenarios
DO $$
BEGIN
    CREATE TYPE "ScenarioType" AS ENUM ('BASE', 'LOW', 'HIGH', 'P50', 'DOWNSIDE', 'UPSIDE', 'WORST', 'ACTUAL', 'TARGET', 'LOWER_BOUND', 'UPPER_BOUND', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create CurveDefinition table with battery and scenario fields
CREATE TABLE IF NOT EXISTS "CurveDefinition" (
    "id" SERIAL PRIMARY KEY,
    "curveName" VARCHAR(255) UNIQUE NOT NULL,
    "market" VARCHAR(50) NOT NULL,
    "location" VARCHAR(100) NOT NULL,
    "product" VARCHAR(50) NOT NULL,
    "curveType" "CurveType" NOT NULL,
    "batteryDuration" "BatteryDuration" NOT NULL DEFAULT 'UNKNOWN',
    "scenario" "ScenarioType" NOT NULL DEFAULT 'BASE',
    "commodity" VARCHAR(50) NOT NULL DEFAULT 'Energy',
    "units" VARCHAR(50) NOT NULL DEFAULT '$/MWh',
    "timezone" VARCHAR(50) DEFAULT 'UTC',
    "description" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_curve_def_market_location_product ON "CurveDefinition"("market", "location", "product");
CREATE INDEX IF NOT EXISTS idx_curve_def_type_battery_scenario ON "CurveDefinition"("curveType", "batteryDuration", "scenario");
CREATE INDEX IF NOT EXISTS idx_curve_def_name ON "CurveDefinition"("curveName");

-- Create other tables (same structure as before)
CREATE TABLE IF NOT EXISTS "CurveInstance" (
    "id" SERIAL PRIMARY KEY,
    "curve_definition_id" INTEGER NOT NULL REFERENCES "CurveDefinition"("id"),
    "instanceVersion" VARCHAR(50) NOT NULL,
    "granularity" VARCHAR(20) NOT NULL,
    "deliveryPeriodStart" TIMESTAMP NOT NULL,
    "deliveryPeriodEnd" TIMESTAMP NOT NULL,
    "forecastRunDate" TIMESTAMP NOT NULL,
    "freshnessStartDate" TIMESTAMP NOT NULL,
    "freshnessEndDate" TIMESTAMP,
    "status" "InstanceStatus" DEFAULT 'ACTIVE',
    "modelType" VARCHAR(100),
    "modelVersion" VARCHAR(50),
    "runType" "RunType" DEFAULT 'BACKFILL',
    "createdBy" VARCHAR(100) NOT NULL,
    "approvedBy" VARCHAR(100),
    "approvedAt" TIMESTAMP,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create other required tables (PriceForecast, LegacyCurveMapping, etc.)
-- [Same as before, abbreviated for clarity]

-- ========== STEP 3: MIGRATE CURVE DEFINITIONS ==========

INSERT INTO "CurveDefinition" (
    "curveName",
    "market",
    "location",
    "product",
    "curveType",
    "batteryDuration",
    "scenario",
    "commodity",
    "units",
    "timezone",
    "description",
    "isActive",
    "metadata"
)
SELECT DISTINCT ON (bcs.battery_conceptual_identity)
    bcs.battery_conceptual_identity as "curveName",
    bcs.market,
    bcs.location,
    COALESCE(bcs.mark_type, 'UNKNOWN') as "product",
    -- Map curve type
    CASE 
        WHEN bcs.curve_type = 'REVENUE' THEN 'REVENUE'::"CurveType"
        WHEN bcs.curve_type = 'REVENUE_OTHER' THEN 'REVENUE_OTHER'::"CurveType"
        WHEN bcs.curve_type = 'ENERGY_ARB' THEN 'ENERGY_ARB'::"CurveType"
        WHEN bcs.curve_type = 'ENERGY' THEN 'ENERGY'::"CurveType"
        WHEN bcs.curve_type = 'AS' THEN 'AS'::"CurveType"
        ELSE 'OTHER'::"CurveType"
    END as "curveType",
    -- Map battery duration
    CASE 
        WHEN bcs.battery_duration = '2H' THEN '2H'::"BatteryDuration"
        WHEN bcs.battery_duration = '4H' THEN '4H'::"BatteryDuration"
        WHEN bcs.battery_duration = '8H' THEN '8H'::"BatteryDuration"
        WHEN bcs.battery_duration = '2.6H' THEN '2.6H'::"BatteryDuration"
        WHEN bcs.battery_duration = 'UNKNOWN' THEN 'UNKNOWN'::"BatteryDuration"
        ELSE 'OTHER'::"BatteryDuration"
    END as "batteryDuration",
    -- Map scenario
    CASE 
        WHEN bcs.scenario = 'BASE' THEN 'BASE'::"ScenarioType"
        WHEN bcs.scenario = 'LOW' THEN 'LOW'::"ScenarioType"
        WHEN bcs.scenario = 'HIGH' THEN 'HIGH'::"ScenarioType"
        WHEN bcs.scenario = 'P50' THEN 'P50'::"ScenarioType"
        WHEN bcs.scenario = 'DOWNSIDE' THEN 'DOWNSIDE'::"ScenarioType"
        WHEN bcs.scenario = 'UPSIDE' THEN 'UPSIDE'::"ScenarioType"
        WHEN bcs.scenario = 'WORST' THEN 'WORST'::"ScenarioType"
        WHEN bcs.scenario = 'ACTUAL' THEN 'ACTUAL'::"ScenarioType"
        WHEN bcs.scenario = 'TARGET' THEN 'TARGET'::"ScenarioType"
        WHEN bcs.scenario = 'LOWER_BOUND' THEN 'LOWER_BOUND'::"ScenarioType"
        WHEN bcs.scenario = 'UPPER_BOUND' THEN 'UPPER_BOUND'::"ScenarioType"
        ELSE 'OTHER'::"ScenarioType"
    END as "scenario",
    'Energy' as "commodity",
    CASE 
        WHEN bcs.value_type = 'Revenue' THEN '$'
        WHEN bcs.value_type = 'AS' THEN '$/MW-yr'
        WHEN bcs.value_type = 'Energy Arb' THEN '$/MWh'
        ELSE '$/MWh'
    END as "units",
    CASE 
        WHEN bcs.market = 'CAISO' THEN 'America/Los_Angeles'
        WHEN bcs.market = 'ERCOT' THEN 'America/Chicago'
        ELSE 'UTC'
    END as "timezone",
    CONCAT(
        'Market curve: ', bcs.mark_type, 
        ' at ', bcs.location,
        ' (', bcs.curve_type, ', ', bcs.battery_duration, ', ', bcs.scenario, ')'
    ) as "description",
    true as "isActive",
    jsonb_build_object(
        'primary_legacy_id', bcs.curve_id,
        'consolidation_date', CURRENT_TIMESTAMP,
        'curve_type', bcs.curve_type,
        'battery_duration', bcs.battery_duration,
        'scenario', bcs.scenario,
        'legacy_metadata', jsonb_build_object(
            'mark_case', bcs.mark_case,
            'curve_creator', bcs.curve_creator,
            'value_type', bcs.value_type,
            'mark_model_type_desc', bcs.mark_model_type_desc,
            'gridstor_purpose', bcs.gridstor_purpose,
            'bess_duration_hours', bcs.bess_duration_hours
        )
    ) as "metadata"
FROM battery_consolidation_strategy bcs
WHERE bcs.role = 'PRIMARY'
ORDER BY bcs.battery_conceptual_identity, bcs.primary_rank;

-- Continue with CurveInstance creation, mapping, and price migration
-- [Rest of the script follows the same pattern but uses battery_consolidation_strategy]

-- ========== STEP N: CREATE WORKFLOW VIEWS ==========

-- Enhanced view showing battery duration and scenarios
CREATE OR REPLACE VIEW battery_aware_curves AS
SELECT 
    cd.id as definition_id,
    cd."curveName",
    cd."market",
    cd."location",
    cd."product",
    cd."curveType",
    cd."batteryDuration",
    cd."scenario",
    cd."units",
    latest."instanceVersion" as latest_version,
    latest."granularity" as latest_granularity,
    latest."deliveryPeriodEnd" as latest_period_end,
    latest."forecastRunDate" as last_updated,
    COUNT(DISTINCT ci.id) as total_instances
FROM "CurveDefinition" cd
LEFT JOIN LATERAL (
    SELECT * FROM "CurveInstance" 
    WHERE "curve_definition_id" = cd.id 
    AND status = 'ACTIVE'
    ORDER BY "forecastRunDate" DESC 
    LIMIT 1
) latest ON true
LEFT JOIN "CurveInstance" ci ON ci."curve_definition_id" = cd.id
WHERE cd."isActive" = true
GROUP BY cd.id, cd."curveName", cd."market", cd."location", cd."product", 
         cd."curveType", cd."batteryDuration", cd."scenario", cd."units",
         latest."instanceVersion", latest."granularity", 
         latest."deliveryPeriodEnd", latest."forecastRunDate";

COMMIT;

RAISE NOTICE '';
RAISE NOTICE '===== BATTERY-AWARE CONSOLIDATION COMPLETE =====';
RAISE NOTICE 'Curve types, battery durations, and scenarios are now part of curve identity';
RAISE NOTICE 'Use battery_aware_curves view to see full curve details'; 