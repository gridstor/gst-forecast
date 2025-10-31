# Upload Page Guide

## Quick Start

1. **Access the upload page:**
   - Development: `http://localhost:4321/admin/upload`
   - The dev server runs on port **4321** (configured in netlify.toml)

2. **Three-Step Workflow:**

### Step 1: Curve Definition
- **Toggle:** "Select Existing" (default) or "Create New"
- **Select Mode:** Browse and search existing definitions, click to select
- **Create Mode:** Fill in all fields to create a new definition
- Required fields: Curve Name, Market, Location, Product, Curve Type, Granularity, Units

### Step 2: Curve Instance  
- **Toggle:** "Select Existing" or "Create New" (default)
- **Select Mode:** After selecting a definition, browse its instances
- **Create Mode:** Fill in instance details
- Required fields: Instance Version, Delivery Period Start/End

### Step 3: Curve Data
- **Upload CSV:** Select a CSV file with your price data
- **Download Template:** Click to generate a template based on your selected granularity and date range
- CSV Format: `timestamp,value,pvalue,units`

## CSV Format

### Required Columns
- `timestamp` - ISO 8601 format (e.g., 2024-01-01T00:00:00Z)
- `value` - Numeric price value

### Optional Columns
- `pvalue` - P-value (5, 25, 50, 75, 95) - defaults to 50
- `units` - Units ($/MWh, $/kW-month, etc.) - inherits from definition if not specified

### Example CSV
```csv
timestamp,value,pvalue,units
2024-01-01T00:00:00Z,45.50,5,$/MWh
2024-01-01T00:00:00Z,48.25,25,$/MWh
2024-01-01T00:00:00Z,52.75,50,$/MWh
2024-01-01T00:00:00Z,57.10,75,$/MWh
2024-01-01T00:00:00Z,62.20,95,$/MWh
2024-01-01T01:00:00Z,44.80,5,$/MWh
```

## Template Generator

1. Click "Download CSV Template"
2. Select start and end dates
3. Choose which P-values to include (P5, P25, P50, P75, P95)
4. Template will be generated with timestamps based on the selected granularity
5. Fill in the `value` column with your data
6. Upload the completed CSV

## API Endpoints Used

- `GET /api/curves/definitions` - List all curve definitions
- `GET /api/curves/instances?definitionId={id}` - List instances for a definition
- `GET /api/curves/{id}/data` - Get existing data for an instance
- `POST /api/curve-upload/create-definition` - Create new definition
- `POST /api/curve-upload/create-instance` - Create new instance
- `POST /api/curve-upload/upload-data` - Upload price data

## Troubleshooting

### 404 Error on API Calls
- **Problem:** Accessing page on wrong port (e.g., 4322 instead of 4321)
- **Solution:** Use `http://localhost:4321/admin/upload`
- **Check:** Run `npm run dev` and note the port in the console output

### "Unexpected token '<'" Error
- **Problem:** API endpoint returning HTML (404 page) instead of JSON
- **Solution:** Verify you're on the correct port and the dev server is running

### No Definitions Loading
- **Problem:** Database might be empty or connection issue
- **Solution:** 
  1. Check database connection in Prisma
  2. Run `npx prisma studio` to verify data exists
  3. Check console for detailed error messages

### CSV Upload Fails
- **Problem:** Timestamps outside delivery period or invalid format
- **Solution:**
  1. Ensure timestamps are in ISO 8601 format
  2. Verify timestamps fall within the instance's delivery period
  3. Check that P50 value exists (required)

## Database Schema

See `CURRENT_DATABASE_SCHEMA.md` for full schema documentation.

### Key Tables
- **CurveDefinition** - Metadata (market, location, product, etc.)
- **CurveInstance** - Specific version/run (delivery period, version, etc.)
- **CurveData** - Actual price points with P-values (P5, P25, P50, P75, P95)

## Next Steps

1. Create your first curve definition (or select existing)
2. Create an instance with your delivery period
3. Download a template or prepare your CSV
4. Upload your data
5. View your curve in the curve tracker or viewer pages
