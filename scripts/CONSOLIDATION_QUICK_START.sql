-- QUICK START: Consolidation for Workflow-Compatible Architecture
-- Run these scripts in order in pgAdmin

-- ========== STEP 1: ANALYZE YOUR DATA (OPTIONAL BUT RECOMMENDED) ==========
-- This shows what you're working with
/*
Run: scripts/analyze-curve-structure.sql

Expected output:
- Total curves: 72
- True unique conceptual curves: ~50-60
- Shows which curves have duplicates and why
*/

-- ========== STEP 2: RUN CONSOLIDATION ==========
-- This is the main consolidation that creates the new architecture
/*
Run: scripts/workflow-compatible-consolidation.sql

This will:
1. Create CurveDefinition table with ~50-60 unique curves
2. Create CurveInstance table with all 72 original records
3. Migrate all price data
4. Create workflow support views
*/

-- ========== STEP 3: COMPLETE WORKFLOW SETUP ==========
-- This adds scheduling and remaining infrastructure
/*
Run: prisma/migrations/004_complete_workflow_migration.sql

This will:
1. Create intelligent schedules for all curves
2. Add helper functions
3. Create views for curves needing updates
*/

-- ========== STEP 4: VERIFY SUCCESS ==========

-- Check consolidation summary
SELECT 
    'CurveDefinitions' as table_name, COUNT(*) as count 
FROM "CurveDefinition"
UNION ALL
SELECT 
    'CurveInstances' as table_name, COUNT(*) as count 
FROM "CurveInstance"
UNION ALL
SELECT 
    'PriceForecasts' as table_name, COUNT(*) as count 
FROM "PriceForecast"
UNION ALL
SELECT 
    'CurveSchedules' as table_name, COUNT(*) as count 
FROM "CurveSchedule";

-- Show curves with multiple instances
SELECT 
    cd."curveName",
    cd."market",
    cd."location",
    COUNT(ci.id) as instances,
    STRING_AGG(DISTINCT ci."granularity", ', ' ORDER BY ci."granularity") as granularities
FROM "CurveDefinition" cd
JOIN "CurveInstance" ci ON ci."curve_definition_id" = cd.id
GROUP BY cd."curveName", cd."market", cd."location"
HAVING COUNT(ci.id) > 1
ORDER BY instances DESC
LIMIT 10;

-- ========== WORKFLOW EXAMPLES ==========

-- Example 1: Check what curves need updating
SELECT 
    "curveName",
    "market",
    "location",
    "frequency",
    last_updated,
    next_update_due
FROM curves_needing_update 
WHERE is_stale 
ORDER BY "importance" DESC, next_update_due
LIMIT 10;

-- Example 2: View curves available for upload page
SELECT 
    definition_id,
    "curveName",
    "market",
    "location",
    latest_version,
    latest_granularity,
    total_instances
FROM upload_page_curves
WHERE "market" = 'ERCOT'
ORDER BY "curveName";

-- Example 3: Create a new curve instance
SELECT create_curve_instance_version(
    p_definition_id := 1,  -- Get from upload_page_curves
    p_delivery_start := '2024-02-01'::timestamp,
    p_delivery_end := '2024-02-29'::timestamp,
    p_granularity := 'MONTHLY',
    p_created_by := 'your_username',
    p_notes := 'February 2024 update'
);

-- ========== IMPORTANT NOTES ==========
/*
1. Your original 72 curves are now:
   - ~50-60 CurveDefinitions (unique by market+location+product)
   - 72 CurveInstances (preserving all variations)

2. Workflow support:
   - Upload page: Use upload_page_curves view
   - Inventory: Use inventory_page_instances view
   - Scheduling: Works with definitions, not instances
   - Updates: Use curves_needing_update view

3. All price data is preserved and properly linked

4. Backward compatibility maintained through curve_definitions_compat view
*/ 