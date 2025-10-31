# Run Curve Schema Migration

## Quick Start

Run this command to execute the migration:

```powershell
# Using psql (if installed)
psql "postgresql://brett_rudder:XYGyCEdpGqehNPn@gridstor-dev.cxoowsyptaww.us-east-2.rds.amazonaws.com:5432/analytics_workspace?schema=Forecasts&sslmode=require" -f scripts/run-curve-migration.sql

# OR using npx with pg
npx pg "postgresql://brett_rudder:XYGyCEdpGqehNPn@gridstor-dev.cxoowsyptaww.us-east-2.rds.amazonaws.com:5432/analytics_workspace?schema=Forecasts&sslmode=require" -f scripts/run-curve-migration.sql
```

## Alternative: Run via Node Script

If you don't have psql installed, I can create a Node.js script to run it.

## What the Migration Does

1. ✅ Adds `curveType` and `commodity` columns to CurveInstance
2. ✅ Copies existing values from CurveDefinition to CurveInstance
3. ✅ Creates new indexes for efficient filtering
4. ✅ Updates old indexes
5. ✅ Verifies the migration succeeded

## After Migration

Run this to regenerate Prisma client:
```bash
npx prisma generate
```

Then restart your dev server:
```bash
npm run dev
```

## Safety

- The migration is wrapped in a transaction (will rollback on error)
- Old columns on CurveDefinition are NOT dropped (for safety)
- You can manually drop them later with:
  ```sql
  ALTER TABLE "Forecasts"."CurveDefinition" 
    DROP COLUMN IF EXISTS "curveType",
    DROP COLUMN IF EXISTS "commodity";
  ```

## Verify

After running, you can verify with:
```sql
SELECT 
  COUNT(*) as total_instances,
  COUNT("curveType") as instances_with_type,
  COUNT("commodity") as instances_with_commodity
FROM "Forecasts"."CurveInstance";
```

All counts should be equal (all instances should have curveType and commodity populated).

