-- QUICK FIX FOR DUPLICATE CURVE NAMES
-- Run this in pgAdmin to fix the duplicate curve issue before migration

-- STEP 1: See what duplicates you have
SELECT 
    market || '_' || mark_type || '_' || location as combo,
    COUNT(*) as count,
    STRING_AGG(curve_id::text, ', ') as curve_ids
FROM "Forecasts".curve_definitions
GROUP BY market, mark_type, location
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- STEP 2: Add unique_name column and populate it
ALTER TABLE "Forecasts".curve_definitions 
ADD COLUMN IF NOT EXISTS unique_name VARCHAR(255);

-- STEP 3: Update all curves with unique names
WITH numbered_curves AS (
    SELECT 
        curve_id,
        UPPER(CONCAT(
            COALESCE(market, 'UNKNOWN'), '_',
            COALESCE(mark_type, 'TYPE'), '_',
            REPLACE(COALESCE(location, 'LOC'), ' ', '_')
        )) as base_name,
        ROW_NUMBER() OVER (
            PARTITION BY UPPER(CONCAT(
                COALESCE(market, 'UNKNOWN'), '_',
                COALESCE(mark_type, 'TYPE'), '_',
                REPLACE(COALESCE(location, 'LOC'), ' ', '_')
            ))
            ORDER BY created_at ASC, curve_id ASC
        ) as rn
    FROM "Forecasts".curve_definitions
)
UPDATE "Forecasts".curve_definitions cd
SET unique_name = CASE 
    WHEN nc.rn = 1 THEN nc.base_name
    ELSE CONCAT(nc.base_name, '_V', nc.rn)
END
FROM numbered_curves nc
WHERE cd.curve_id = nc.curve_id;

-- STEP 4: Verify all names are unique
SELECT 
    CASE 
        WHEN COUNT(DISTINCT unique_name) = COUNT(*) THEN 'SUCCESS: All names are unique!'
        ELSE 'ERROR: Still have duplicates'
    END as result,
    COUNT(*) as total_curves,
    COUNT(DISTINCT unique_name) as unique_names
FROM "Forecasts".curve_definitions;

-- STEP 5: Show what got renamed
SELECT 
    curve_id,
    market || ' - ' || mark_type || ' - ' || location as original,
    unique_name,
    CASE WHEN unique_name LIKE '%_V%' THEN 'RENAMED' ELSE 'UNCHANGED' END as status
FROM "Forecasts".curve_definitions
WHERE unique_name LIKE '%_V%'
ORDER BY unique_name; 