# Complete Consolidation Execution Guide

## Overview

This guide provides the exact steps to consolidate your 72 curve_definitions records into a proper CurveDefinition/CurveInstance architecture that supports your complete workflow.

## Architecture Summary

**BEFORE**: 72 curve_definitions records with duplicates
**AFTER**: ~50-60 CurveDefinitions (one per conceptual curve) with 72 CurveInstances (preserving all variations)

## Pre-Consolidation Analysis

First, run the analysis to understand your data:

```sql
-- Run in pgAdmin
-- Copy from: scripts/analyze-curve-structure.sql
```

This will show you:
- How many true unique conceptual curves you have
- What makes the "duplicates" different (granularity, dates, models)
- Consolidation recommendations

## Step-by-Step Execution

### Step 1: Run the Consolidation Script

```sql
-- Run in pgAdmin
-- Copy from: scripts/workflow-compatible-consolidation.sql
```

This script will:
1. Create ONE CurveDefinition per conceptual curve (market + mark_type + location)
2. Create CurveInstances for ALL 72 original records
3. Preserve ALL price_forecast data with proper linkages
4. Create workflow support views

### Step 2: Complete the Workflow Setup

```sql
-- Run in pgAdmin
-- Copy from: prisma/migrations/004_complete_workflow_migration.sql
```

This script will:
1. Create intelligent schedules based on curve characteristics
2. Set up version history tracking
3. Create helper functions for instance management
4. Create views for curves needing updates

## What You Get

### 1. CurveDefinitions (One per conceptual curve)
```
ERCOT_HOUSTON_AURORA_HOUSTON
├── Definition contains: market, location, product, timezone
└── Used for: scheduling, categorization, search/filter
```

### 2. CurveInstances (Multiple per definition)
```
ERCOT_HOUSTON_AURORA_HOUSTON
├── Instance 1: legacy_monthly_v1 (Monthly granularity, 2023 data)
├── Instance 2: legacy_hourly_v2 (Hourly granularity, 2023 data)
└── Instance 3: legacy_annual_v3 (Annual granularity, 2024 forecast)
```

### 3. Workflow Support

**Upload Curves Page**
- View: `upload_page_curves`
- Shows all definitions with latest instance info
- Can create new definitions OR add instances to existing

**Inventory Page**
- View: `inventory_page_instances`
- Shows all instances with their details
- Can filter by definition, granularity, date range

**Scheduling**
- Works with definitions (not instances)
- Intelligent frequencies based on product type
- Freshness tracking per schedule

**Creating New Instances**
```sql
-- Example: Add new monthly forecast for February 2024
SELECT create_curve_instance_version(
    p_definition_id := 1,  -- ERCOT_HOUSTON_AURORA_HOUSTON
    p_delivery_start := '2024-02-01',
    p_delivery_end := '2024-02-29',
    p_granularity := 'MONTHLY',
    p_created_by := 'john.doe',
    p_notes := 'February 2024 monthly forecast update'
);
```

## Verification Queries

### Check Consolidation Results
```sql
-- Summary of definitions and instances
SELECT 
    cd."curveName",
    cd."market",
    cd."location",
    COUNT(ci.id) as instance_count,
    STRING_AGG(DISTINCT ci."granularity", ', ') as granularities
FROM "CurveDefinition" cd
JOIN "CurveInstance" ci ON ci."curve_definition_id" = cd.id
GROUP BY cd."curveName", cd."market", cd."location"
ORDER BY instance_count DESC;
```

### Check Curves Needing Updates
```sql
-- View stale curves
SELECT * FROM curves_needing_update WHERE is_stale;
```

### Verify Price Data Migration
```sql
-- Compare counts
SELECT 
    'Original' as source,
    COUNT(*) as count
FROM "Forecasts".price_forecasts_legacy
UNION ALL
SELECT 
    'Migrated' as source,
    COUNT(*) as count
FROM "PriceForecast";
```

## Workflow Examples

### 1. Upload Page - Check if curve exists
```sql
-- Search for existing definition
SELECT * FROM upload_page_curves 
WHERE "market" = 'ERCOT' 
  AND "location" = 'Houston'
  AND "product" = 'HOUSTON_AURORA';
```

### 2. Create New Instance for Scheduled Update
```sql
-- Fulfill a scheduled update
SELECT create_curve_instance_version(
    p_definition_id := (SELECT definition_id FROM curves_needing_update WHERE is_stale LIMIT 1),
    p_delivery_start := DATE_TRUNC('month', CURRENT_DATE),
    p_delivery_end := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month') - INTERVAL '1 day',
    p_granularity := 'MONTHLY',
    p_created_by := 'scheduler',
    p_run_type := 'SCHEDULED'
);
```

### 3. Ad Hoc Curve Creation
```sql
-- First check if definition exists
-- If not, create new definition
INSERT INTO "CurveDefinition" ("curveName", "market", "location", "product", ...)
VALUES ('ERCOT_NEW_LOCATION_LMP', 'ERCOT', 'New Location', 'LMP', ...);

-- Then create instance
SELECT create_curve_instance_version(...);
```

## Benefits of This Architecture

1. **Clean Conceptual Model**: One definition per curve concept
2. **Version History**: Track all versions and updates
3. **Granularity Flexibility**: Same curve can have hourly, daily, monthly instances
4. **Workflow Support**: Upload page knows what exists, scheduling works properly
5. **Data Integrity**: All price data preserved and properly linked

## Next Steps

After consolidation:
1. Update your application code to use the new views
2. Test upload workflow with new architecture
3. Implement version comparison features
4. Set up automated quality metrics collection

## Troubleshooting

**Issue**: Duplicate key error
**Solution**: A curve name already exists - check conceptual identity generation

**Issue**: Price count mismatch
**Solution**: Check for NULL curve_ids in price_forecasts table

**Issue**: No schedules created
**Solution**: Run Step 2 (complete workflow migration)

## Summary

Your 72 curve_definitions are now properly organized as:
- **~50-60 CurveDefinitions**: One per unique market/location/product
- **72 CurveInstances**: Preserving all variations with proper versioning
- **Complete Workflow Support**: Upload, inventory, scheduling all work correctly 