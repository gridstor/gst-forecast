# Energy Forecast Architecture Migration Execution Plan

## Overview
This document provides step-by-step instructions for migrating your AWS RDS database to the new energy forecast architecture using ONLY existing real data.

## Pre-Migration Checklist

- [ ] Backup AWS RDS database
- [ ] Have DBA access to execute DDL commands
- [ ] Note current record counts (72 curves expected)
- [ ] Schedule maintenance window (estimated 15-30 minutes)
- [ ] Have rollback plan ready

## Step 1: Test Migration Readiness

Connect to your AWS RDS instance and run the test script:

```bash
psql -h gridstor-dev.cxoowsyptaww.us-east-2.rds.amazonaws.com \
     -U your_username \
     -d your_database \
     -f scripts/test-migration.sql
```

Expected output:
- 72 curve definitions
- No duplicate curve names
- Price forecast count (may be 0)
- Curve schedule count (may be 0)

## Step 2: Backup Current Data

Create a backup of critical tables:

```sql
-- Create backup schema
CREATE SCHEMA IF NOT EXISTS backup_20240115;

-- Backup existing tables
CREATE TABLE backup_20240115.curve_definitions AS 
SELECT * FROM "Forecasts".curve_definitions;

CREATE TABLE backup_20240115.price_forecasts AS 
SELECT * FROM "Forecasts".price_forecasts;

CREATE TABLE backup_20240115.curve_schedule AS 
SELECT * FROM "Forecasts".curve_schedule;
```

## Step 3: Execute Migration

Run the main migration script:

```bash
psql -h gridstor-dev.cxoowsyptaww.us-east-2.rds.amazonaws.com \
     -U your_username \
     -d your_database \
     -f prisma/migrations/002_energy_forecast_migration_real_data.sql
```

Expected output:
```
NOTICE: Starting migration with 72 curves, X price records, Y schedules
NOTICE: Migration complete: 72 curves, X instances, X prices, 72 schedules
```

## Step 4: Verify Migration

Run verification queries:

```sql
-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('CurveDefinition', 'CurveInstance', 'PriceForecast', 'CurveSchedule')
ORDER BY table_name;

-- Verify all 72 curves migrated
SELECT COUNT(*) as curve_count FROM "CurveDefinition";

-- Check curve instances (if price data existed)
SELECT 
    cd."market",
    cd."location",
    COUNT(DISTINCT cd.id) as definition_count,
    COUNT(ci.id) as instance_count
FROM "CurveDefinition" cd
LEFT JOIN "CurveInstance" ci ON ci."curve_definition_id" = cd.id
GROUP BY cd."market", cd."location"
ORDER BY cd."market", cd."location";

-- Test compatibility view
SELECT COUNT(*) FROM curve_definitions_compat;

-- Check schedules were created
SELECT 
    cs."frequency",
    COUNT(*) as schedule_count
FROM "CurveSchedule" cs
GROUP BY cs."frequency";
```

## Step 5: Update Application Configuration

1. **Update Prisma Schema**
   ```bash
   # Backup current schema
   cp prisma/schema.prisma prisma/schema.backup.prisma
   
   # Copy new schema
   cp prisma/schema.new.prisma prisma/schema.prisma
   
   # Generate Prisma client
   npx prisma generate
   ```

2. **Deploy New UI Pages**
   - Test new curve schedule page at `/curve-schedule/index-new`
   - Once verified, replace the original page

3. **Update Environment Variables** (if needed)
   - No changes required to DATABASE_URL
   - Schema remains "Forecasts"

## Step 6: Test Application

1. **Test Read Operations**
   - Navigate to `/curve-schedule`
   - Verify all 72 curves appear
   - Check calendar views work
   - Ensure no errors in console

2. **Test Write Operations**
   - Try creating a new curve instance through API
   - Verify lineage tracking works
   - Test schedule updates

## Step 7: Monitor and Validate

Monitor for 24-48 hours:
- Check application logs for errors
- Verify scheduled jobs still run
- Monitor database performance
- Ensure all users can access data

## Rollback Plan

If issues arise, rollback using:

```sql
-- Rollback script
BEGIN;

-- Drop new tables
DROP TABLE IF EXISTS "PriceForecast" CASCADE;
DROP TABLE IF EXISTS "CurveInputLineage" CASCADE;
DROP TABLE IF EXISTS "VersionHistory" CASCADE;
DROP TABLE IF EXISTS "QualityMetric" CASCADE;
DROP TABLE IF EXISTS "ScheduleRun" CASCADE;
DROP TABLE IF EXISTS "DefaultCurveInput" CASCADE;
DROP TABLE IF EXISTS "CurveSchedule" CASCADE;
DROP TABLE IF EXISTS "CurveInstance" CASCADE;
DROP TABLE IF EXISTS "CurveDefinition" CASCADE;
DROP TABLE IF EXISTS "LegacyCurveMapping" CASCADE;

-- Drop new types
DROP TYPE IF EXISTS "InstanceStatus" CASCADE;
DROP TYPE IF EXISTS "RunType" CASCADE;
DROP TYPE IF EXISTS "InputType" CASCADE;
DROP TYPE IF EXISTS "UsageType" CASCADE;
DROP TYPE IF EXISTS "ChangeType" CASCADE;
DROP TYPE IF EXISTS "ScheduleType" CASCADE;
DROP TYPE IF EXISTS "UpdateFrequency" CASCADE;
DROP TYPE IF EXISTS "RunStatus" CASCADE;

-- Restore original tables
ALTER TABLE "Forecasts".price_forecasts_legacy RENAME TO price_forecasts;
ALTER TABLE "Forecasts".curve_schedule_legacy RENAME TO curve_schedule;

-- Drop compatibility view
DROP VIEW IF EXISTS curve_definitions_compat;

COMMIT;

-- Restore from backup if needed
INSERT INTO "Forecasts".curve_definitions 
SELECT * FROM backup_20240115.curve_definitions;
```

## Post-Migration Tasks

1. **Update Documentation**
   - Document new table structure
   - Update API documentation
   - Train team on new architecture

2. **Plan Next Features**
   - Implement real lineage tracking
   - Add quality metrics collection
   - Build version comparison tools

3. **Clean Up**
   - After 30 days, drop backup schema
   - Remove legacy tables
   - Archive migration scripts

## Key Points

- **NO FAKE DATA**: Migration uses only your existing 72 curves
- **MINIMAL CHANGES**: Creates only required records
- **BACKWARD COMPATIBLE**: Old queries work via compatibility view
- **SAFE ROLLBACK**: Can revert to original state if needed
- **PRESERVES DATA**: All existing data is migrated, nothing is lost

## Support

If issues arise during migration:
1. Stop the migration immediately
2. Check error logs
3. Run rollback if needed
4. Contact DBA support if database issues
5. Review migration script for any environment-specific adjustments 