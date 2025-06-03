# Proper Curve Consolidation Guide

## The Right Architecture Approach

You were absolutely correct - the new architecture is designed so that:

- **CurveDefinition** = ONE per conceptual energy curve (e.g., "ERCOT Houston Aurora Houston")
- **CurveInstance** = MULTIPLE versions/granularities/time periods of that curve

This allows you to track:
- Different granularities (hourly, daily, monthly) as separate instances
- Different time periods as separate instances
- Version history (v1, v2, v3) as you update forecasts
- All linked to the same conceptual curve definition

## Step-by-Step Execution

### 1. First, Rollback the Wrong Approach

```sql
-- Run in pgAdmin
-- Copy from: scripts/rollback-unique-name.sql
```

This will:
- Remove the `unique_name` column
- Restore original data from backup (if available)
- Get you back to the starting point

### 2. Analyze Your Curve Variations

```sql
-- Run in pgAdmin
-- Copy from: scripts/analyze-curve-variations.sql
```

This shows you:
- Which curves have duplicates
- What makes them different (granularity, dates, models)
- How price data is distributed
- Recommendations for which variant to use as primary

### 3. Run the Proper Consolidation

```sql
-- Run in pgAdmin
-- Copy from: scripts/consolidate-curves-properly.sql
```

This script:
- Creates ONE CurveDefinition per conceptual curve
- Creates MULTIPLE CurveInstances for each variant
- Preserves ALL your price data
- Maps everything properly

### 4. Complete the Migration

```sql
-- Run in pgAdmin
-- Copy from: prisma/migrations/003_energy_forecast_consolidated.sql
```

This completes the setup by:
- Creating remaining tables
- Setting up schedules
- Adding helper functions
- Creating backward compatibility views

## What You'll Get

### Example: ERCOT Houston Aurora Houston

**Before (Wrong Approach):**
```
curve_definitions:
- ERCOT_HOUSTON_AURORA_HOUSTON (id: 45, granularity: MONTHLY)
- ERCOT_HOUSTON_AURORA_HOUSTON_V2 (id: 67, granularity: HOURLY)
- ERCOT_HOUSTON_AURORA_HOUSTON_V3 (id: 89, granularity: ANNUAL)
```

**After (Correct Approach):**
```
CurveDefinition:
- ERCOT_HOUSTON_AURORA_HOUSTON (id: 1)

CurveInstance:
- id: 101, version: "legacy_MONTHLY_v1", granularity: MONTHLY
- id: 102, version: "legacy_HOURLY_v2", granularity: HOURLY  
- id: 103, version: "legacy_ANNUAL_v3", granularity: ANNUAL
```

### Benefits

1. **Clean API** - One curve definition to query
2. **Version History** - See all versions/granularities for a curve
3. **Proper Forecasting** - Create new instances for updated forecasts
4. **Lineage Tracking** - Know what inputs went into each instance

## Verification Queries

After consolidation, run these checks:

```sql
-- Check consolidation results
SELECT 
    cd."curveName",
    COUNT(ci.id) as instance_count,
    jsonb_agg(DISTINCT ci."metadata"->>'legacy_granularity') as granularities
FROM "CurveDefinition" cd
JOIN "CurveInstance" ci ON ci."curve_definition_id" = cd.id
GROUP BY cd."curveName"
HAVING COUNT(ci.id) > 1
ORDER BY instance_count DESC;

-- Verify price data preserved
SELECT 
    'Original' as source,
    COUNT(*) as price_count
FROM "Forecasts".price_forecasts
UNION ALL
SELECT 
    'New' as source,
    COUNT(*) as price_count
FROM "PriceForecast";

-- Check legacy mapping
SELECT 
    lcm."oldCurveId",
    cd."curveName",
    ci."instanceVersion",
    ci."metadata"->>'legacy_granularity' as granularity
FROM "LegacyCurveMapping" lcm
JOIN "CurveDefinition" cd ON cd.id = lcm."newCurveDefinitionId"
JOIN "CurveInstance" ci ON ci.id = lcm."newCurveInstanceId"
ORDER BY cd."curveName", lcm."oldCurveId";
```

## Going Forward

With this architecture, when you need to update a forecast:

```sql
-- Create a new instance for updated forecast
INSERT INTO "CurveInstance" (
    "curve_definition_id",
    "instanceVersion",
    "deliveryPeriodStart",
    "deliveryPeriodEnd",
    "forecastRunDate",
    "freshnessStartDate",
    "status",
    "modelType",
    "createdBy"
) VALUES (
    1, -- ERCOT_HOUSTON_AURORA_HOUSTON definition
    'v2024_01_hourly',
    '2024-02-01',
    '2024-02-29',
    NOW(),
    NOW(),
    'ACTIVE',
    'FUNDAMENTAL_V3',
    'scheduler'
);
```

The old instance automatically becomes superseded based on freshness dates.

## Summary

1. **Rollback** the unique_name approach
2. **Analyze** what makes your "duplicates" different
3. **Consolidate** to one definition with multiple instances
4. **Complete** the migration

This gives you a sophisticated energy forecasting system that properly tracks versions, granularities, and lineage! 