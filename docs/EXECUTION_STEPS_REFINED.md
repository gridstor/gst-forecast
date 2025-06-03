# Refined Consolidation Execution Steps

## Quick Start Guide

This guide provides the exact steps to run the refined consolidation that handles degradation scenarios and curve types.

## Step 1: Analyze Your Data First

Run the analysis script to understand your curve structure:

```sql
-- Run in pgAdmin on your AWS RDS
-- File: scripts/analyze-curve-degradation-types.sql
```

This will show you:
- What columns exist in curve_definitions
- How mark_case encodes degradation (years like 2024, 2025, etc.)
- How mark_type encodes curve types (Revenue, Energy, AS, etc.)
- Preview of how many unique curves you'll have after consolidation

## Step 2: Run the Refined Consolidation

Execute the main consolidation script:

```sql
-- Run in pgAdmin on your AWS RDS
-- File: scripts/complete-refined-consolidation.sql
```

This script will:
1. Create CurveDefinitions for each unique combination of:
   - Market (ERCOT, CAISO)
   - Location (Houston, North, etc.)
   - Curve Type (Revenue, Energy, AS, TB2, TB4, RA)
   - Degradation Scenario (Undegraded, Deg_2024, Deg_2025, etc.)

2. Create CurveInstances for all 72 original records
3. Migrate all price data with proper linkages
4. Create enhanced views for workflow support

## Step 3: Complete Workflow Setup

Add scheduling and remaining infrastructure:

```sql
-- Run in pgAdmin on your AWS RDS
-- File: prisma/migrations/004_complete_workflow_migration.sql
```

## Step 4: Verify Results

Check the consolidation worked correctly:

```sql
-- View curves by type and degradation
SELECT * FROM curves_by_type_and_degradation;

-- View all curves with enhanced details
SELECT * FROM upload_page_curves_enhanced
ORDER BY "curveType", "degradationType", "market", "location";

-- Check specific curve types (e.g., Revenue curves)
SELECT * FROM upload_page_curves_enhanced
WHERE "curveType" = 'REVENUE';

-- Check degradation scenarios
SELECT * FROM upload_page_curves_enhanced
WHERE "degradationType" LIKE 'DEG_%'
ORDER BY "degradationType";
```

## What You'll See After Consolidation

### Example Output Structure:
```
CurveDefinitions (Unique combinations):
- ERCOT_HOUSTON_REVENUE_UNDEGRADED
- ERCOT_HOUSTON_REVENUE_DEG_2024
- ERCOT_HOUSTON_ENERGY_UNDEGRADED
- CAISO_NORTH_AS_UNDEGRADED
... (~50-70 definitions based on your data)

CurveInstances (All 72 variations):
- Each definition has 1+ instances for different:
  - Granularities (Hourly, Daily, Monthly)
  - Time periods
  - Model versions
```

## Using the New Architecture

### Finding Curves by Type
```sql
-- All Revenue curves
SELECT * FROM upload_page_curves_enhanced WHERE "curveType" = 'REVENUE';

-- All Energy Arbitrage curves
SELECT * FROM upload_page_curves_enhanced WHERE "curveType" = 'ENERGY_ARB';

-- All Ancillary Service curves
SELECT * FROM upload_page_curves_enhanced WHERE "curveType" = 'AS';
```

### Finding Curves by Degradation
```sql
-- All undegraded curves
SELECT * FROM upload_page_curves_enhanced WHERE "degradationType" = 'UNDEGRADED';

-- All 2024 degradation curves
SELECT * FROM upload_page_curves_enhanced WHERE "degradationType" = 'DEG_2024';

-- All curves with any degradation
SELECT * FROM upload_page_curves_enhanced WHERE "degradationType" != 'UNDEGRADED';
```

### Creating New Curves
When creating new curves, always specify:
- curveType (REVENUE, ENERGY, AS, etc.)
- degradationType (UNDEGRADED, DEG_2024, etc.)

## Troubleshooting

**Issue**: Script fails with duplicate key error
**Solution**: Drop existing tables first or modify script to handle existing data

**Issue**: Wrong curve type classification
**Solution**: Review the CASE statements in complete-refined-consolidation.sql and adjust patterns

**Issue**: Degradation years not detected
**Solution**: Check your mark_case values and adjust the regex patterns

## Next Steps

1. Update your application code to use:
   - `upload_page_curves_enhanced` instead of basic views
   - Filter by curveType and degradationType
   
2. Create UI components for:
   - Curve type selection dropdown
   - Degradation scenario filter
   
3. Set up different scheduling rules for different curve types 