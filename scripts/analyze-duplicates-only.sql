-- Quick Duplicate Analysis Script
-- Run this first to see what duplicates you have

-- Find all potential duplicate curve names
WITH duplicate_check AS (
    SELECT 
        curve_id,
        market,
        mark_type,
        location,
        mark_case,
        curve_creator,
        created_at,
        -- This is how the migration would generate the curve name
        UPPER(CONCAT(
            COALESCE(market, 'UNKNOWN'), '_',
            COALESCE(mark_type, 'TYPE'), '_',
            REPLACE(COALESCE(location, 'LOC'), ' ', '_')
        )) as generated_name
    FROM "Forecasts".curve_definitions
),
duplicate_summary AS (
    SELECT 
        generated_name,
        COUNT(*) as duplicate_count,
        STRING_AGG(
            CONCAT('ID:', curve_id, ' (', COALESCE(mark_case, 'no case'), ')'), 
            ' | ' 
            ORDER BY created_at
        ) as curve_details
    FROM duplicate_check
    GROUP BY generated_name
    HAVING COUNT(*) > 1
)
SELECT 
    generated_name as "Duplicate Curve Name",
    duplicate_count as "Count",
    curve_details as "Curve IDs and Cases"
FROM duplicate_summary
ORDER BY duplicate_count DESC, generated_name;

-- Show detailed information for all duplicates
SELECT 
    dc.curve_id,
    dc.market,
    dc.mark_type,
    dc.location,
    dc.mark_case,
    dc.curve_creator,
    dc.created_at::date as created_date,
    dc.generated_name,
    ROW_NUMBER() OVER (PARTITION BY dc.generated_name ORDER BY dc.created_at, dc.curve_id) as suggested_version
FROM duplicate_check dc
WHERE dc.generated_name IN (
    SELECT generated_name 
    FROM duplicate_check 
    GROUP BY generated_name 
    HAVING COUNT(*) > 1
)
ORDER BY dc.generated_name, dc.created_at;

-- Summary statistics
SELECT 
    COUNT(DISTINCT curve_id) as total_curves,
    COUNT(DISTINCT generated_name) as unique_names_after_fix,
    COUNT(DISTINCT curve_id) - COUNT(DISTINCT generated_name) as curves_to_rename,
    STRING_AGG(DISTINCT market, ', ') as markets_affected
FROM duplicate_check
WHERE generated_name IN (
    SELECT generated_name 
    FROM duplicate_check 
    GROUP BY generated_name 
    HAVING COUNT(*) > 1
); 