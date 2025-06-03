-- =====================================================
-- SAMPLE DATA STRUCTURE EXAMPLES
-- Shows how the new energy forecast model works
-- =====================================================

-- ========== EXAMPLE 1: CREATING A CURVE DEFINITION ==========

-- Create a Revenue curve for ERCOT Houston 4H battery Base scenario
INSERT INTO "Forecasts"."CurveDefinition" (
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
    "createdBy"
) VALUES (
    'ERCOT_HOUSTON_REVENUE_4H_BASE',
    'ERCOT',
    'Houston',
    'Aurora_Houston_Revenue_4h',
    'REVENUE',
    '4H',
    'BASE',
    'Energy',
    '$',
    'America/Chicago',
    'Base case revenue forecast for 4-hour battery in ERCOT Houston',
    'john.doe@gridstor.com'
);

-- Create an AS curve for CAISO SP15 2H battery P50 scenario
INSERT INTO "Forecasts"."CurveDefinition" (
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
    "createdBy"
) VALUES (
    'CAISO_SP15_AS_2H_P50',
    'CAISO',
    'SP15',
    'Aurora_SP15_AS_2h',
    'AS',
    '2H',
    'P50',
    'Energy',
    '$/MW-yr',
    'America/Los_Angeles',
    'P50 ancillary services forecast for 2-hour battery in CAISO SP15',
    'jane.smith@gridstor.com'
);

-- ========== EXAMPLE 2: CREATING CURVE INSTANCES ==========

-- Create a monthly granularity instance for ERCOT Houston Revenue
INSERT INTO "Forecasts"."CurveInstance" (
    "curveDefinitionId",
    "instanceVersion",
    "granularity",
    "deliveryPeriodStart",
    "deliveryPeriodEnd",
    "forecastRunDate",
    "freshnessStartDate",
    "status",
    "modelType",
    "modelVersion",
    "runType",
    "createdBy",
    "notes"
) VALUES (
    1, -- Assuming this is the ID from the first curve definition
    '2024_01_monthly_v1',
    'MONTHLY',
    '2024-01-01 00:00:00-06',
    '2030-12-31 23:59:59-06',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'ACTIVE',
    'Aurora',
    'v2024.1',
    'SCHEDULED',
    'john.doe@gridstor.com',
    'January 2024 monthly update - Base case'
);

-- Create an annual granularity instance for the same curve
INSERT INTO "Forecasts"."CurveInstance" (
    "curveDefinitionId",
    "instanceVersion",
    "granularity",
    "deliveryPeriodStart",
    "deliveryPeriodEnd",
    "forecastRunDate",
    "freshnessStartDate",
    "status",
    "modelType",
    "modelVersion",
    "runType",
    "createdBy",
    "notes"
) VALUES (
    1, -- Same curve definition
    '2024_01_annual_v1',
    'ANNUAL',
    '2024-01-01 00:00:00-06',
    '2043-12-31 23:59:59-06',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'ACTIVE',
    'Aurora',
    'v2024.1',
    'SCHEDULED',
    'john.doe@gridstor.com',
    'January 2024 annual forecast - 20 year outlook'
);

-- ========== EXAMPLE 3: ADDING PRICE FORECAST DATA ==========

-- Add monthly price data (showing just a few months)
INSERT INTO "Forecasts"."PriceForecast" (
    "curveInstanceId",
    "timestamp",
    "value",
    "confidence",
    "valueHigh",
    "valueLow"
) VALUES
    (1, '2024-01-01 00:00:00-06', 125000.50, 0.9, 135000.00, 115000.00),
    (1, '2024-02-01 00:00:00-06', 118000.25, 0.9, 128000.00, 108000.00),
    (1, '2024-03-01 00:00:00-06', 132000.75, 0.9, 142000.00, 122000.00),
    (1, '2024-04-01 00:00:00-06', 145000.00, 0.85, 160000.00, 130000.00),
    (1, '2024-05-01 00:00:00-06', 168000.50, 0.85, 185000.00, 151000.00);

-- Add annual price data
INSERT INTO "Forecasts"."PriceForecast" (
    "curveInstanceId",
    "timestamp",
    "value",
    "confidence"
) VALUES
    (2, '2024-01-01 00:00:00-06', 1500000.00, 0.9),
    (2, '2025-01-01 00:00:00-06', 1450000.00, 0.85),
    (2, '2026-01-01 00:00:00-06', 1420000.00, 0.80),
    (2, '2027-01-01 00:00:00-06', 1380000.00, 0.75),
    (2, '2028-01-01 00:00:00-06', 1350000.00, 0.70);

-- ========== EXAMPLE 4: CREATING SCHEDULES ==========

-- Create a monthly schedule for the revenue curve
INSERT INTO "Forecasts"."CurveSchedule" (
    "curveDefinitionId",
    "scheduleType",
    "frequency",
    "dayOfMonth",
    "timeOfDay",
    "freshnessHours",
    "responsibleTeam",
    "notificationEmails",
    "importance"
) VALUES (
    1,
    'REGULAR',
    'MONTHLY',
    5, -- 5th of each month
    '10:00:00',
    720, -- 30 days
    'Market Analysis',
    ARRAY['market-team@gridstor.com', 'john.doe@gridstor.com'],
    4
);

-- Create a weekly schedule for the AS curve
INSERT INTO "Forecasts"."CurveSchedule" (
    "curveDefinitionId",
    "scheduleType",
    "frequency",
    "dayOfWeek",
    "timeOfDay",
    "freshnessHours",
    "responsibleTeam",
    "importance"
) VALUES (
    2,
    'REGULAR',
    'WEEKLY',
    2, -- Tuesday
    '09:00:00',
    168, -- 7 days
    'AS Trading',
    5 -- High importance
);

-- ========== EXAMPLE 5: TRACKING INPUT LINEAGE ==========

-- Record the fundamental inputs used for the forecast
INSERT INTO "Forecasts"."CurveInputLineage" (
    "curveInstanceId",
    "inputType",
    "inputSource",
    "inputIdentifier",
    "inputVersion",
    "inputTimestamp",
    "usageType",
    "weight"
) VALUES
    (1, 'WEATHER_FORECAST', 'NOAA', 'ERCOT_Houston_Weather_Jan2024', 'v1.2', '2024-01-05 00:00:00', 'PRIMARY', 0.3),
    (1, 'DEMAND_FORECAST', 'ERCOT', 'ERCOT_Demand_Forecast_Jan2024', '2024.1', '2024-01-05 00:00:00', 'PRIMARY', 0.4),
    (1, 'FUEL_PRICES', 'EIA', 'Natural_Gas_Forecast_Jan2024', 'Jan24', '2024-01-05 00:00:00', 'PRIMARY', 0.3);

-- ========== EXAMPLE 6: VERSION MANAGEMENT ==========

-- Create a new version of an existing instance
-- This would typically be done through the create_curve_instance_version function
SELECT "Forecasts".create_curve_instance_version(
    1,                          -- curve definition ID
    '2024-01-01 00:00:00-06',   -- delivery start
    '2030-12-31 23:59:59-06',   -- delivery end
    'MONTHLY',                  -- granularity
    'john.doe@gridstor.com',    -- created by
    'SCHEDULED',                -- run type
    'February 2024 scheduled update'
);

-- ========== EXAMPLE 7: QUERYING THE DATA ==========

-- Find all active revenue curves for ERCOT
SELECT * FROM "Forecasts".upload_page_curves
WHERE "market" = 'ERCOT' 
  AND "curveType" = 'REVENUE'
  AND "scenario" = 'BASE'
ORDER BY "location", "batteryDuration";

-- Find curves that need updating
SELECT * FROM "Forecasts".curves_needing_update
WHERE is_stale = true
ORDER BY "importance" DESC, next_update_due;

-- Get inventory of all instances for a specific curve
SELECT * FROM "Forecasts".inventory_page_instances
WHERE "curveName" = 'ERCOT_HOUSTON_REVENUE_4H_BASE'
ORDER BY "forecastRunDate" DESC;

-- Find the latest price forecasts for a curve
SELECT 
    cd."curveName",
    ci."instanceVersion",
    pf."timestamp",
    pf."value",
    pf."confidence",
    pf."valueHigh",
    pf."valueLow"
FROM "Forecasts"."PriceForecast" pf
JOIN "Forecasts"."CurveInstance" ci ON ci."id" = pf."curveInstanceId"
JOIN "Forecasts"."CurveDefinition" cd ON cd."id" = ci."curveDefinitionId"
WHERE cd."curveName" = 'ERCOT_HOUSTON_REVENUE_4H_BASE'
  AND ci."status" = 'ACTIVE'
  AND pf."timestamp" >= '2024-01-01'
ORDER BY pf."timestamp"
LIMIT 12;

-- ========== EXAMPLE 8: WORKFLOW SCENARIOS ==========

-- Scenario 1: Upload page - Check if curve exists before creating
SELECT * FROM "Forecasts".upload_page_curves
WHERE "market" = 'ERCOT'
  AND "location" = 'Houston'
  AND "curveType" = 'REVENUE'
  AND "batteryDuration" = '4H'
  AND "scenario" = 'BASE';

-- Scenario 2: Fulfill a scheduled update
WITH stale_curve AS (
    SELECT definition_id, "curveName"
    FROM "Forecasts".curves_needing_update
    WHERE is_stale = true
    ORDER BY "importance" DESC
    LIMIT 1
)
SELECT "Forecasts".create_curve_instance_version(
    definition_id,
    DATE_TRUNC('month', CURRENT_DATE)::timestamptz,
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '20 years')::timestamptz,
    'MONTHLY',
    'scheduler@gridstor.com',
    'SCHEDULED',
    'Automated monthly update'
) FROM stale_curve;

-- Scenario 3: Compare different scenarios for same location
SELECT 
    "curveName",
    "scenario",
    "batteryDuration",
    latest_version,
    last_updated,
    total_instances
FROM "Forecasts".upload_page_curves
WHERE "market" = 'ERCOT'
  AND "location" = 'Houston'
  AND "curveType" = 'REVENUE'
ORDER BY "batteryDuration", "scenario";

-- =====================================================
-- This demonstrates the key concepts:
-- 1. CurveDefinitions are templates (market + location + type + battery + scenario)
-- 2. CurveInstances are specific forecast runs with data
-- 3. PriceForecast contains the actual time series values
-- 4. Schedules define when curves need updating
-- 5. Version management tracks changes over time
-- 6. Views provide easy access for different workflows
-- ===================================================== 