# Energy Forecast Architecture Redesign

## Overview

This document describes a production-ready architecture for managing energy market forecasts with proper versioning, freshness tracking, and lineage management.

## Core Concepts

### 1. CurveDefinition
A **template** that defines what a curve represents, not the actual forecast data.

Example:
```typescript
{
  id: 1,
  curveName: "CAISO_DA_LMP_SP15",
  market: "CAISO",
  location: "SP15",
  product: "DA_LMP",        // Day-Ahead Locational Marginal Price
  commodity: "Energy",
  units: "$/MWh",
  granularity: "HOURLY",
  timezone: "America/Los_Angeles",
  description: "CAISO Day-Ahead LMP for SP15 trading hub"
}
```

### 2. CurveInstance
A **specific forecast run** for a curve definition with its own freshness period.

Example:
```typescript
{
  id: 1001,
  curveDefinitionId: 1,
  instanceVersion: "v3",
  deliveryPeriodStart: "2024-02-01T00:00:00Z",
  deliveryPeriodEnd: "2024-02-29T23:59:59Z",
  forecastRunDate: "2024-01-15T09:00:00Z",    // When forecast was created
  freshnessStartDate: "2024-01-15T09:00:00Z", // When it became active
  freshnessEndDate: null,                     // Still active (latest version)
  status: "ACTIVE",
  modelType: "FUNDAMENTAL",
  runType: "SCHEDULED",
  createdBy: "scheduling_system"
}
```

### 3. Version Management

Multiple instances can exist for the same delivery period:

```
Monday's Forecast (v1) → Tuesday's Update (v2) → Wednesday's Final (v3)
         ↓                      ↓                         ↓
   Fresh: Mon-Tue        Fresh: Tue-Wed           Fresh: Wed onwards
```

## Key Features

### 1. Freshness Tracking

Each forecast instance has its own freshness period:
- **freshnessStartDate**: When this forecast becomes the "official" version
- **freshnessEndDate**: When it expires (null for current active version)

Query for active forecasts:
```sql
SELECT * FROM CurveInstance 
WHERE curveDefinitionId = 1
  AND status = 'ACTIVE'
  AND freshnessStartDate <= NOW()
  AND (freshnessEndDate IS NULL OR freshnessEndDate > NOW())
```

### 2. Lineage Tracking

Track all inputs that influenced a forecast:

```typescript
// CurveInputLineage records
[
  {
    curveInstanceId: 1001,
    inputType: "WEATHER_FORECAST",
    inputSource: "NOAA",
    inputIdentifier: "gfs_ensemble_2024011500",
    inputVersion: "v2.1",
    inputTimestamp: "2024-01-15T00:00:00Z",
    usageType: "PRIMARY",
    weight: 0.6
  },
  {
    curveInstanceId: 1001,
    inputType: "DEMAND_FORECAST",
    inputSource: "CAISO",
    inputIdentifier: "load_forecast_20240115",
    usageType: "PRIMARY",
    weight: 0.4
  }
]
```

### 3. Schedule Enhancement

Schedules now support:
- **Lead Time**: Run forecast X days before delivery
- **Freshness Hours**: How long a forecast stays active
- **Required Inputs**: What fundamental data must be available

```typescript
{
  curveDefinitionId: 1,
  scheduleType: "REGULAR",
  frequency: "DAILY",
  timeOfDay: "06:00",
  leadTimeDays: 1,           // Run 1 day before delivery
  freshnessHours: 24,         // Valid for 24 hours
  metadata: {
    requiredInputs: [
      "WEATHER_FORECAST:NOAA:temperature_forecast",
      "DEMAND_FORECAST:ISO:load_forecast"
    ]
  }
}
```

## Query Patterns

### 1. Get Current Active Forecasts

```typescript
async function getActiveCurves(asOfDate: Date = new Date()) {
  return `
    WITH ActiveInstances AS (
      SELECT DISTINCT ON (ci.curve_definition_id, DATE(ci.deliveryPeriodStart))
        ci.*,
        cd.curveName,
        cd.market,
        cd.location,
        cd.product
      FROM CurveInstance ci
      JOIN CurveDefinition cd ON cd.id = ci.curve_definition_id
      WHERE ci.status = 'ACTIVE'
        AND ci.freshnessStartDate <= ${asOfDate}
        AND (ci.freshnessEndDate IS NULL OR ci.freshnessEndDate > ${asOfDate})
      ORDER BY ci.curve_definition_id, DATE(ci.deliveryPeriodStart), 
               ci.freshnessStartDate DESC
    )
    SELECT * FROM ActiveInstances
    ORDER BY market, location, deliveryPeriodStart;
  `;
}
```

### 2. Get Version History

```typescript
async function getCurveHistory(curveDefId: number, deliveryDate: Date) {
  return await prisma.curveInstance.findMany({
    where: {
      curveDefinitionId: curveDefId,
      deliveryPeriodStart: deliveryDate
    },
    include: {
      versionHistory: true,
      inputLineage: true,
      qualityMetrics: true
    },
    orderBy: { instanceVersion: 'asc' }
  });
}
```

### 3. Compare Versions

```typescript
async function compareVersions(instanceId1: number, instanceId2: number) {
  // Get both instances with their price data
  const [v1, v2] = await Promise.all([
    getPriceData(instanceId1),
    getPriceData(instanceId2)
  ]);
  
  // Calculate differences
  return {
    priceChanges: calculatePriceDiffs(v1.prices, v2.prices),
    inputChanges: compareInputs(v1.inputs, v2.inputs),
    metrics: {
      mae: calculateMAE(v1.prices, v2.prices),
      maxDiff: calculateMaxDiff(v1.prices, v2.prices)
    }
  };
}
```

## Migration Strategy

### Phase 1: Schema Migration
1. Run the migration script to create new tables
2. Transform existing curve_definitions to CurveDefinition
3. Create initial CurveInstance records from existing data
4. Maintain backward compatibility views

### Phase 2: Update Application
1. Update Prisma schema to use new models
2. Modify API endpoints to work with instances
3. Update UI components to show version history
4. Add lineage tracking to forecast runs

### Phase 3: Enhanced Features
1. Implement quality metrics tracking
2. Add automated freshness monitoring
3. Build lineage visualization
4. Create version comparison tools

## Example Workflows

### 1. Daily Forecast Update

```typescript
// 1. Check if forecast needs updating
const needsUpdate = await checkFreshness(curveDefId);

// 2. Gather required inputs
const inputs = await gatherInputs(schedule.metadata.requiredInputs);

// 3. Create new instance version
const newInstance = await createCurveInstanceVersion({
  curveDefinitionId: curveDefId,
  deliveryPeriodStart: tomorrow,
  deliveryPeriodEnd: tomorrow.endOfDay(),
  modelType: 'FUNDAMENTAL',
  createdBy: 'scheduler',
  priceData: runForecastModel(inputs),
  inputLineage: inputs.map(i => ({
    inputType: i.type,
    inputSource: i.source,
    inputIdentifier: i.id,
    inputVersion: i.version,
    inputTimestamp: i.timestamp,
    usageType: 'PRIMARY'
  }))
});

// 4. Previous version automatically expired
```

### 2. Emergency Update

```typescript
// Create out-of-schedule update
const emergencyUpdate = await createCurveInstanceVersion({
  curveDefinitionId: curveDefId,
  deliveryPeriodStart: today,
  deliveryPeriodEnd: today.endOfDay(),
  modelType: 'FUNDAMENTAL',
  runType: 'TRIGGERED',
  createdBy: 'operations_team',
  notes: 'Emergency update due to transmission outage',
  priceData: adjustedForecast,
  inputLineage: [
    ...normalInputs,
    {
      inputType: 'TRANSMISSION_LIMITS',
      inputSource: 'ISO',
      inputIdentifier: 'emergency_limit_20240115',
      usageType: 'PRIMARY',
      metadata: { reason: 'Line 500kV outage' }
    }
  ]
});
```

### 3. Quality Tracking

```typescript
// After actuals are available
await recordQualityMetrics({
  curveInstanceId: instanceId,
  metrics: [
    { metricType: 'MAE', metricValue: 2.45 },
    { metricType: 'RMSE', metricValue: 3.21 },
    { metricType: 'MAPE', metricValue: 5.2 }
  ],
  comparisonType: 'vs_actual'
});
```

## Benefits

1. **Version Control**: Full history of all forecast updates
2. **Auditability**: Complete lineage of inputs and changes
3. **Flexibility**: Multiple versions can coexist with different freshness periods
4. **Quality Tracking**: Measure forecast accuracy over time
5. **Operational Clarity**: Know exactly which forecast is "official" at any moment

## Implementation Checklist

- [ ] Create new database schema
- [ ] Run migration scripts
- [ ] Update Prisma models
- [ ] Create backward compatibility layer
- [ ] Update curve scheduler components
- [ ] Implement version management UI
- [ ] Add lineage tracking to forecast pipeline
- [ ] Create quality metrics dashboard
- [ ] Set up freshness monitoring alerts
- [ ] Document API changes 