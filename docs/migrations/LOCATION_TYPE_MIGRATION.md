# LocationType Migration

**Date:** November 1, 2025  
**Migration:** `007_add_location_type.sql`

## Overview

This migration adds a `locationType` field to the `CurveDefinition` table to distinguish between hub-level and nodal pricing locations. This distinction is important for graphing capabilities and analysis.

## Changes Made

### 1. Schema Updates

Added to `prisma/schema.prisma`:

```typescript
enum LocationType {
  HUB
  NODE

  @@schema("Forecasts")
}

model CurveDefinition {
  // ... other fields
  locationType    LocationType?   // HUB or NODE - distinguishes hub-level vs nodal pricing
  // ... other fields
  
  @@index([locationType])
}
```

### 2. Database Changes

The migration performs the following:

1. **Creates `LocationType` enum** with values: `HUB`, `NODE`
2. **Adds `locationType` column** to `CurveDefinition` table
3. **Populates existing records:**
   - **NODES:** Goleta, Santa Fe Springs, Hidden Lakes, Gunner, Odessa
   - **HUBS:** SP15, NP15, Houston South, SPP North Hub, SPP South Hub, and all others
4. **Creates index** on `locationType` for query performance
5. **Adds documentation** via column comment

### 3. Location Classifications

#### Nodes (NODE)
These are specific nodal pricing locations:
- Goleta
- Santa Fe Springs
- Hidden Lakes
- Gunnar
- Odessa

#### Hubs (HUB)
These are hub-level pricing locations:
- SP15
- NP15 (when added)
- Houston / Houston South
- North Hub (SPP)
- South Hub (SPP)
- West (ERCOT West)
- All other locations default to HUB

## How to Run the Migration

### Option 1: Using npm script (Recommended)

```bash
npm run migrate:locationtype
```

### Option 2: Direct SQL execution

```bash
psql $DATABASE_URL -f prisma/migrations/007_add_location_type.sql
```

### Option 3: Manual Prisma execution

```bash
# First regenerate Prisma client (stop dev server first if needed)
npx prisma generate

# Then run the TypeScript migration script
tsx scripts/add-location-type.ts
```

## Verification

After running the migration, verify the results:

```sql
SELECT 
  "locationType",
  COUNT(*) as count,
  array_agg(DISTINCT location ORDER BY location) as locations
FROM "Forecasts"."CurveDefinition"
GROUP BY "locationType"
ORDER BY "locationType";
```

Expected output:
- HUB: Multiple locations (SP15, NP15, Houston South, etc.)
- NODE: 5 locations (Goleta, Santa Fe Springs, Hidden Lakes, Gunner, Odessa)

## Usage in Code

### TypeScript/Prisma

```typescript
import { PrismaClient, LocationType } from '@prisma/client';

const prisma = new PrismaClient();

// Query curves by location type
const hubCurves = await prisma.curveDefinition.findMany({
  where: {
    locationType: LocationType.HUB
  }
});

const nodalCurves = await prisma.curveDefinition.findMany({
  where: {
    locationType: LocationType.NODE
  }
});
```

### API Queries

```typescript
// Get all hub locations
const hubs = await query(`
  SELECT * FROM "Forecasts"."CurveDefinition"
  WHERE "locationType" = 'HUB'
`);

// Get all nodal locations
const nodes = await query(`
  SELECT * FROM "Forecasts"."CurveDefinition"
  WHERE "locationType" = 'NODE'
`);
```

## Impact on Existing Code

### Minimal Breaking Changes
- The field is **optional** (nullable), so existing code continues to work
- Existing queries don't need to be updated
- The field is purely additive

### Recommended Updates
Consider updating:
- Graphing components to use `locationType` for visualization differences
- Filtering/search UI to include location type as a filter option
- Location selection dropdowns to group by hub vs node

## Files Modified

1. `prisma/schema.prisma` - Added enum and field
2. `prisma/migrations/007_add_location_type.sql` - SQL migration
3. `scripts/add-location-type.ts` - TypeScript migration runner
4. `package.json` - Added `migrate:locationtype` script
5. `docs/CURVE_FORMAT_INSTRUCTIONS.md` - Updated documentation

## Rollback (if needed)

If you need to rollback this migration:

```sql
-- Remove the index
DROP INDEX IF EXISTS "Forecasts"."idx_curvedefinition_locationtype";

-- Remove the column
ALTER TABLE "Forecasts"."CurveDefinition" DROP COLUMN "locationType";

-- Remove the enum
DROP TYPE IF EXISTS "Forecasts"."LocationType";
```

## Next Steps

After running this migration:

1. Restart your development server to pick up the new Prisma types
2. Update any graphing components that should differentiate between hubs and nodes
3. Consider adding location type filters to the curve management UI
4. Update any curve upload interfaces to allow setting the location type

## Support

If you encounter issues:
- Check that the DATABASE_URL environment variable is set correctly
- Ensure you have write permissions to the database
- Verify the Forecasts schema exists
- Look for any duplicate location names that might need manual classification

