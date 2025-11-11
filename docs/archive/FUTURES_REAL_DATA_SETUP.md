# Futures Markets - Real Data Setup Guide

## ✅ Completed Steps

1. **Database Connection Updated** - `src/lib/db.ts` now checks for `DATABASE_URL_THIRD`
2. **Example API Updated** - `src/pages/api/futures/natural-gas.ts` now has real query example

## 📋 What You Need to Do

### Step 1: Verify Database Connection

After restarting your dev server, check the terminal for:
```
Successfully connected to the database with SSL
```

If you see this, your database connection is working! ✅

### Step 2: Understand Your Data Structure

You need to have futures data in your database. Based on your schema, the data should be in:

- **Table**: `curve_definitions` + `price_forecasts`
- **Required Fields**:
  - `market`: e.g., 'Natural Gas', 'Power', 'Heat Rate'
  - `location`: e.g., 'HSC', 'Katy', 'Houston', etc.
  - `flow_date_start`: The date/year of the forecast
  - `value`: The price/rate value
  - `units`: $/MMBtu, $/MWh, or MMBtu/MWh

### Step 3: Verify Your Data

Run this query in your database to check if you have futures data:

```sql
-- Check if you have Natural Gas futures data
SELECT 
  cd.location,
  cd.market,
  COUNT(*) as data_points,
  MAX(cd.mark_date) as latest_date
FROM curve_definitions cd
JOIN price_forecasts pf ON cd.curve_id = pf.curve_id
WHERE cd.market LIKE '%Gas%' OR cd.market LIKE '%Power%'
GROUP BY cd.location, cd.market
ORDER BY cd.market, cd.location;
```

### Step 4: Update API Endpoints (if needed)

The current queries assume this structure:
```
curve_definitions
├── curve_id (PK)
├── market (e.g., 'Natural Gas')
├── location (e.g., 'HSC')
├── mark_date (latest curve date)
└── ...

price_forecasts
├── curve_id (FK)
├── flow_date_start (year/date)
├── value (price)
└── units
```

**If your data structure is different**, you'll need to modify the queries in:
- `src/pages/api/futures/natural-gas.ts`
- `src/pages/api/futures/power.ts`
- `src/pages/api/futures/heat-rate.ts`

### Step 5: Update Remaining Endpoints

I've updated the Natural Gas endpoint as an example. You need to do the same for:

1. **Power Futures** (`src/pages/api/futures/power.ts`)
   - Query for Power market data
   - Filter by `peakHour` parameter
   - Locations: Houston, ERCOT South/North/West, SP 15

2. **Heat Rate Futures** (`src/pages/api/futures/heat-rate.ts`)
   - Calculate: `heat_rate = power_price / gas_price`
   - OR query pre-calculated heat rate data
   - Same locations as Power

## 🔍 Debugging

If the page shows "Error fetching data":

1. **Check Browser Console** (F12) for error messages
2. **Check Terminal** for database errors
3. **Check Network Tab** to see the API response

## 📊 Expected Data Format

Each API endpoint should return:

```json
{
  "success": true,
  "data": {
    "tableData": [
      {
        "market": "HSC",
        "2025": 2.85,
        "2026": 3.12,
        "tenYearStrip": 3.45,
        "twentyFiveYearStrip": 3.62,
        "totalStrip": 3.58
      }
    ],
    "years": [2025, 2026, 2027, ...],
    "markets": ["HSC", "Katy", ...]
  },
  "metadata": {
    "latestCurveDate": "2024-11-03",
    "units": "$/MMBtu",
    "dataSource": "Database"
  }
}
```

## 🚨 Common Issues

### "No data available"
- Check if your database has data for the queried markets
- Verify the SQL query returns results
- Check the data transformation logic

### "Database query error"
- Verify DATABASE_URL_THIRD is correct
- Check table/column names match your schema
- Look for SQL syntax errors in terminal

### Mock data still showing
- The endpoints have fallback mock data if queries fail
- Check terminal for database errors
- Verify the query is actually running

## ✨ Next Steps

Once you have real data flowing:

1. **Test all three tables** (Gas, Power, Heat Rate)
2. **Test Calendar vs Month toggle**
3. **Test Peak Hour toggles** (for Power/Heat Rate)
4. **Verify strip calculations** are correct
5. **Add the Comparison View** chart functionality (optional)

## 📞 Need Help?

If your data structure is significantly different, share:
1. Your database schema for futures data
2. Sample rows from your tables
3. How you want the data displayed

I can help adjust the queries to match your specific setup!

