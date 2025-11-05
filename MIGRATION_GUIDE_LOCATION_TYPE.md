# 🎯 Location Type Migration - Quick Start Guide

## What This Adds

A new `locationType` field on `CurveDefinition` to distinguish between:
- **HUB** - Hub-level pricing locations (SP15, NP15, Houston South, etc.)
- **NODE** - Nodal pricing locations (Goleta, Santa Fe Springs, Hidden Lakes, Gunner, Odessa)

## Pre-classified Locations

### Nodes (NODE)
✅ Goleta  
✅ Santa Fe Springs  
✅ Hidden Lakes  
✅ Gunnar  
✅ Odessa

### Hubs (HUB)
✅ SP15  
✅ Houston  
✅ North Hub (SPP)  
✅ South Hub (SPP)  
✅ West (ERCOT)  
✅ All other locations

## How to Run

### Step 1: Stop your dev server (if running)
```bash
# Press Ctrl+C to stop the dev server
```

### Step 2: Run the migration
```bash
npm run migrate:locationtype
```

### Step 3: Restart your dev server
```bash
npm run dev
```

That's it! ✨

## What Happens

The migration will:
1. ✅ Create the `LocationType` enum (HUB, NODE)
2. ✅ Add `locationType` column to `CurveDefinition`
3. ✅ Populate all existing curves with the correct location type
4. ✅ Create an index for performance
5. ✅ Show you a summary of what was updated

## Verification

After running, you'll see output like:

```
Location Type Distribution:

  HUB:
    Count: 18
    Locations: SP15, NP15, Houston South, ...

  NODE:
    Count: 5
    Locations: Goleta, Santa Fe Springs, Hidden Lakes, Gunner, Odessa
```

## Using in Your Code

### In Prisma queries:
```typescript
import { LocationType } from '@prisma/client';

// Find all hub locations
const hubs = await prisma.curveDefinition.findMany({
  where: { locationType: LocationType.HUB }
});

// Find all node locations
const nodes = await prisma.curveDefinition.findMany({
  where: { locationType: LocationType.NODE }
});
```

### In raw SQL:
```sql
SELECT * FROM "Forecasts"."CurveDefinition"
WHERE "locationType" = 'HUB';
```

## Graphing Use Cases

This field enables you to:
- 🎨 Color code hubs vs nodes differently
- 📊 Group/filter curves by location type
- 🗺️ Show hubs and nodes on different map layers
- 📈 Apply different analysis methods to hubs vs nodes

## Need Help?

See detailed documentation: `docs/migrations/LOCATION_TYPE_MIGRATION.md`

## Common Issues

**Q: Prisma generate fails with "operation not permitted"**  
A: Stop your dev server first, then run the migration

**Q: Can I change a location from HUB to NODE?**  
A: Yes! Update the record:
```sql
UPDATE "Forecasts"."CurveDefinition" 
SET "locationType" = 'NODE' 
WHERE location = 'YourLocation';
```

**Q: What if I add a new curve?**  
A: Set the `locationType` when creating it, or it will default to NULL (can be set later)

