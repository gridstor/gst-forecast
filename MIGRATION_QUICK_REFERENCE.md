# Energy Forecast Migration - Quick Reference

## 🚀 Migration Commands

```bash
# 1. Test readiness
psql -h your-rds-host -U your-user -d your-db -f scripts/test-migration.sql

# 2. Check for duplicates (NEW!)
psql -h your-rds-host -U your-user -d your-db -f scripts/analyze-duplicates-only.sql

# 3. Fix duplicates if found (NEW!)
psql -h your-rds-host -U your-user -d your-db -f scripts/fix-duplicate-curves.sql

# 4. Run migration
psql -h your-rds-host -U your-user -d your-db -f prisma/migrations/002_energy_forecast_migration_real_data.sql

# 5. Verify
psql -h your-rds-host -U your-user -d your-db -c "SELECT COUNT(*) FROM \"CurveDefinition\""
```

## 📊 What Gets Migrated

| Old Table | New Table | Records Expected |
|-----------|-----------|------------------|
| curve_definitions | CurveDefinition | 72 |
| price_forecasts | PriceForecast | All existing |
| curve_schedule | CurveSchedule | 72 (or existing) |

## 🏗️ New Architecture

```
CurveDefinition (Template)
    ↓
CurveInstance (Forecast Run v1, v2, v3...)
    ↓
PriceForecast (Time Series Data)
    ↓
CurveInputLineage (What inputs were used)
```

## ✅ Key Features

- **Version Control**: Multiple forecasts per delivery period
- **Freshness Tracking**: Know which forecast is active when
- **Lineage**: Track all inputs used in each forecast
- **Auto-expiry**: Old versions automatically superseded

## 🔄 Rollback If Needed

```sql
-- Quick rollback
psql -h your-rds-host -U your-user -d your-db -f scripts/rollback-migration.sql
```

## 📱 Test New API

```bash
# Create a new curve instance
curl -X POST http://localhost:4321/api/curve-instance/create \
  -H "Content-Type: application/json" \
  -d '{
    "curveDefinitionId": 1,
    "deliveryPeriodStart": "2024-02-01",
    "deliveryPeriodEnd": "2024-02-29",
    "modelType": "FUNDAMENTAL",
    "priceData": [
      {"timestamp": "2024-02-01T00:00:00Z", "value": 45.50}
    ],
    "inputLineage": [
      {
        "inputType": "WEATHER_FORECAST",
        "inputSource": "NOAA",
        "inputIdentifier": "gfs_20240115",
        "inputTimestamp": "2024-01-15T00:00:00Z"
      }
    ]
  }'
```

## 🎯 Post-Migration Checklist

- [ ] All 72 curves visible in UI
- [ ] Can create new curve instances via API
- [ ] Calendar views working
- [ ] No errors in console
- [ ] Schedules showing correct frequencies
- [ ] Compatibility view returns 72 records

## ⚠️ Important Notes

1. **FIX DUPLICATES FIRST** - Run duplicate fix before migration
2. **NO FAKE DATA** - Only real data is migrated
3. **Backward Compatible** - Old queries still work via views
4. **Safe Rollback** - Can revert anytime within 30 days
5. **Preserve Everything** - No data is lost

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Duplicate curve names | Run fix-duplicate-curves.sql first |
| Migration fails | Run rollback, check error logs |
| UI shows no data | Check compatibility view |
| Can't create instances | Verify ENUMs were created |

## 📞 Support Contacts

- Database issues: DBA team
- Application issues: Dev team
- Migration questions: Review this guide + full docs 