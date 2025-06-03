-- Test script to verify migration readiness
-- Run this BEFORE executing the actual migration

-- Check current state
SELECT 
    'Curve Definitions' as table_name,
    COUNT(*) as record_count
FROM "Forecasts".curve_definitions
UNION ALL
SELECT 
    'Price Forecasts' as table_name,
    COUNT(*) as record_count
FROM "Forecasts".price_forecasts
UNION ALL
SELECT 
    'Curve Schedule' as table_name,
    COUNT(*) as record_count
FROM "Forecasts".curve_schedule;

-- Check for duplicate curve names that would cause issues
WITH potential_names AS (
    SELECT 
        UPPER(CONCAT(
            COALESCE(market, 'UNKNOWN'), '_',
            COALESCE(mark_type, 'TYPE'), '_',
            REPLACE(COALESCE(location, 'LOC'), ' ', '_')
        )) as curve_name,
        COUNT(*) as duplicate_count
    FROM "Forecasts".curve_definitions
    GROUP BY 1
    HAVING COUNT(*) > 1
)
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS: No duplicate curve names'
        ELSE 'FAIL: ' || COUNT(*) || ' duplicate curve names found'
    END as duplicate_check
FROM potential_names;

-- Check for NULL values in critical fields
SELECT 
    'NULL market' as issue,
    COUNT(*) as count
FROM "Forecasts".curve_definitions
WHERE market IS NULL
UNION ALL
SELECT 
    'NULL location' as issue,
    COUNT(*) as count
FROM "Forecasts".curve_definitions
WHERE location IS NULL
UNION ALL
SELECT 
    'NULL mark_type' as issue,
    COUNT(*) as count
FROM "Forecasts".curve_definitions
WHERE mark_type IS NULL;

-- Preview what curve names will look like
SELECT 
    curve_id,
    market,
    location,
    mark_type,
    UPPER(CONCAT(
        COALESCE(market, 'UNKNOWN'), '_',
        COALESCE(mark_type, 'TYPE'), '_',
        REPLACE(COALESCE(location, 'LOC'), ' ', '_')
    )) as new_curve_name
FROM "Forecasts".curve_definitions
ORDER BY market, location
LIMIT 10;

-- Check price data distribution
SELECT 
    cd.market,
    cd.location,
    COUNT(DISTINCT cd.curve_id) as curve_count,
    COUNT(pf.curve_id) as price_record_count,
    MIN(pf.flow_date_start) as earliest_price,
    MAX(pf.flow_date_start) as latest_price
FROM "Forecasts".curve_definitions cd
LEFT JOIN "Forecasts".price_forecasts pf ON cd.curve_id = pf.curve_id
GROUP BY cd.market, cd.location
ORDER BY cd.market, cd.location; 