# 🚀 Curve Upload - Freshness Quick Start

## Critical Change: Freshness is Now at CurveData Level

Each curve type + commodity can have its own freshness period.

---

## ✅ What You MUST Do When Uploading

### 1. Add These Fields to Every CurveData Row

```typescript
{
  // ... your existing fields ...
  freshnessStartDate: new Date(),  // When this becomes fresh
  freshnessEndDate: null,          // NULL = currently fresh
}
```

### 2. Supersede Old Data First

```typescript
// Before uploading "Total Revenue", supersede the old one
await prisma.curveData.updateMany({
  where: {
    curveInstance: { curveDefinitionId: YOUR_DEF_ID },
    curveType: "Revenue Forecast",
    commodity: "Total Revenue",
    freshnessEndDate: null  // Find currently fresh
  },
  data: {
    freshnessEndDate: new Date()  // Mark as superseded
  }
});
```

---

## 📋 Complete Upload Template

```typescript
// Step 1: Supersede old data
await prisma.curveData.updateMany({
  where: {
    curveInstance: { curveDefinitionId: definitionId },
    curveType: "Revenue Forecast",
    commodity: "Total Revenue",
    freshnessEndDate: null
  },
  data: { freshnessEndDate: new Date() }
});

// Step 2: Create new data with freshness
await prisma.curveData.createMany({
  data: rows.map(row => ({
    curveInstanceId: instanceId,
    timestamp: row.timestamp,
    value: row.value,
    curveType: row.curveType,
    commodity: row.commodity,
    scenario: row.scenario,
    units: row.units,
    freshnessStartDate: new Date(),  // ← ADD THIS
    freshnessEndDate: null,          // ← ADD THIS
  }))
});
```

---

## 🎯 Why?

**Old Way**: Entire instance is fresh or not  
**New Way**: Total Revenue can be fresh while AS Revenue is archived (different update schedules)

---

## ✅ Verify After Upload

```sql
-- Should return ZERO rows (no duplicate fresh data)
SELECT curveType, commodity, COUNT(*) 
FROM "Forecasts"."CurveData"
WHERE freshnessEndDate IS NULL
GROUP BY curveType, commodity
HAVING COUNT(DISTINCT curveInstanceId) > 1;
```

---

**Full docs**: `docs/FOR_UPLOAD_AGENT_FRESHNESS_INSTRUCTIONS.md`  
**Utilities**: `src/lib/curveDataFreshness.ts`  
**Migration**: `migrations/APPLY_THIS_add_freshness_to_curve_data.sql`

