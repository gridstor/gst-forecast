# ✅ Location Type Feature - Complete

## Summary

Successfully added `locationType` field to `CurveDefinition` to distinguish between hub-level and nodal pricing locations.

## Files Created/Modified

### Schema Changes
- ✅ `prisma/schema.prisma` - Added `LocationType` enum and field to `CurveDefinition`

### Migration Files
- ✅ `prisma/migrations/007_add_location_type.sql` - SQL migration script
- ✅ `scripts/add-location-type.ts` - TypeScript migration runner

### Documentation
- ✅ `docs/CURVE_FORMAT_INSTRUCTIONS.md` - Updated with locationType field
- ✅ `docs/migrations/LOCATION_TYPE_MIGRATION.md` - Comprehensive migration docs
- ✅ `MIGRATION_GUIDE_LOCATION_TYPE.md` - Quick start guide (this file can be deleted after migration)

### Configuration
- ✅ `package.json` - Added `npm run migrate:locationtype` script

## Database Schema Changes

```sql
-- New Enum
CREATE TYPE "Forecasts"."LocationType" AS ENUM ('HUB', 'NODE');

-- New Column
ALTER TABLE "Forecasts"."CurveDefinition" 
ADD COLUMN "locationType" "Forecasts"."LocationType";

-- Populated with classifications:
-- NODES: Goleta, Santa Fe Springs, Hidden Lakes, Gunner, Odessa
-- HUBS: SP15, NP15, Houston South, SPP North Hub, SPP South Hub, and all others
```

## Location Classifications

| Type | Locations |
|------|-----------|
| **NODE** | Goleta, Santa Fe Springs, Hidden Lakes, Gunnar, Odessa |
| **HUB** | SP15, Houston, North Hub (SPP), South Hub (SPP), West (ERCOT), and all other locations |

## How to Apply

### Run the migration:
```bash
npm run migrate:locationtype
```

### Then restart your dev server:
```bash
npm run dev
```

## TypeScript Usage

After migration and server restart:

```typescript
import { LocationType } from '@prisma/client';

// Query by location type
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

// Create new curve with location type
await prisma.curveDefinition.create({
  data: {
    curveName: "CAISO_SP15_4H_2025",
    market: "CAISO",
    location: "SP15",
    locationType: LocationType.HUB, // Specify type
    batteryDuration: "FOUR_H",
    // ... other fields
  }
});
```

## SQL Usage

```sql
-- Get all hub locations
SELECT * FROM "Forecasts"."CurveDefinition"
WHERE "locationType" = 'HUB';

-- Get all nodal locations  
SELECT * FROM "Forecasts"."CurveDefinition"
WHERE "locationType" = 'NODE';

-- Update a location type
UPDATE "Forecasts"."CurveDefinition"
SET "locationType" = 'NODE'
WHERE location = 'SomeLocation';
```

## Use Cases

This field enables:

1. **Graphing Differentiation** - Color code or style hubs vs nodes differently
2. **Filtering** - Allow users to filter curves by location type
3. **Analysis** - Apply different analytical methods for hubs vs nodes
4. **Mapping** - Display hubs and nodes on different map layers
5. **Validation** - Ensure appropriate data handling based on location type

## API Integration

The field is automatically available in all API endpoints that return `CurveDefinition` data:

```json
{
  "id": 1,
  "curveName": "CAISO_SP15_4H_Q1_2025",
  "market": "CAISO",
  "location": "SP15",
  "locationType": "HUB",
  "batteryDuration": "FOUR_H",
  ...
}
```

## Next Steps

1. ✅ Run the migration: `npm run migrate:locationtype`
2. ✅ Restart dev server: `npm run dev`
3. 🔄 Update graphing components to use `locationType`
4. 🔄 Add location type filter to UI components
5. 🔄 Update curve upload forms to allow setting location type

## Notes

- Field is **optional** (nullable) - won't break existing code
- Existing curves are auto-classified during migration
- Can be updated manually if classifications need adjustment
- Indexed for query performance

## Ready to Apply

Everything is set up and ready to go! Just run:

```bash
npm run migrate:locationtype
```

The migration will show you exactly what it's doing and verify the results.

