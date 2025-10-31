# Database Setup Guide for GST-Forecast

## Current Status

✅ **You have a `.env` file** with AWS RDS connection:
```
DATABASE_URL="postgresql://brett_rudder:****@gridstor-dev.cxoowsyptaww.us-east-2.rds.amazonaws.com:5432/analytics_workspace?schema=Forecasts&sslmode=require"
```

## Problem: Empty Data

Your app shows empty data because the `curve_schedule` table is empty in the AWS RDS database.

## Quick Solution

### 1. Test Your Connection

Run this command to verify your database connection:
```bash
tsx scripts/quick-test-db.ts
```

This will show you:
- ✅ Connection status
- 📊 Record counts in each table
- ⚠️ Whether you need to populate data

### 2. Populate the curve_schedule Table

If the test shows 0 records in `curve_schedule`, run:
```bash
npm run populate-curves
```

This will create sample curve schedules for:
- ERCOT locations (Odessa, Hidden Lakes, etc.)
- CAISO locations (Goleta, SP15 Hub, etc.)
- Both EXTERNAL (Aurora) and INTERNAL (GST) curves

### 3. Verify in Browser

After populating data, check these endpoints:
- http://localhost:4321/api/test-analytics-db - Database status
- http://localhost:4321/curve-schedule - Main schedule page
- http://localhost:4321/curve-schedule/calendar - Calendar view

## Database Structure

Your AWS RDS database (`analytics_workspace`) has:
- **Schema**: Forecasts (not public)
- **Tables**:
  - `curve_definitions` - Curve metadata (likely has data)
  - `curve_schedule` - Schedule tracking (currently empty)
  - `price_forecasts` - Price data
  - Related tables for comments, receipts, history

## Troubleshooting

### If Connection Fails
1. Check VPN/network access to AWS RDS
2. Verify security group allows your IP
3. Check if SSL certificate is valid

### If Data Still Empty After Population
1. Check Prisma logs in the console
2. Verify the schema parameter: `?schema=Forecasts`
3. Try the SQL script directly:
   ```bash
   psql $DATABASE_URL -f scripts/populate_curve_schedule.sql
   ```

### Common Issues
- **P2021 Error**: Table not found - check schema name
- **P1001 Error**: Connection failed - check network/VPN
- **SSL Error**: Update SSL settings in database config

## Next Steps

After populating data:
1. Set up actual update schedules based on your needs
2. Configure email notifications for overdue curves
3. Import historical update data if available 