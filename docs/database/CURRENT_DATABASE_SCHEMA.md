# Current Database Schema

## Schema: Forecasts

### Tables

#### CurveDefinition
Defines the metadata for a price curve (market, location, product type, etc.)

**Key Fields:**
- `id` - Primary key
- `curveName` - Unique name for the curve
- `market` - Market (CAISO, ERCOT, PJM, etc.)
- `location` - Location/node (NP15, SP15, Channel View, etc.)
- `product` - Product type (Optimized Revenue, Market Price Forecast, etc.)
- `curveType` - Type enum (REVENUE, ENERGY, AS, etc.)
- `batteryDuration` - Battery duration enum (TWO_H, FOUR_H, EIGHT_H, etc.)
- `granularity` - Time granularity (HOURLY, DAILY, MONTHLY, QUARTERLY, ANNUAL)
- `units` - Units ($/MWh, $/kW-month, etc.)
- `scenario` - Scenario/case (P5, P25, P50, P75, P95, BASE, etc.)
- `degradationType` - Degradation type enum
- `commodity` - Commodity type
- `description` - Optional description
- `isActive` - Boolean flag
- `createdAt`, `updatedAt` - Timestamps

#### CurveInstance
Represents a specific version/run of a curve definition

**Key Fields:**
- `id` - Primary key
- `curveDefinitionId` - Foreign key to CurveDefinition
- `instanceVersion` - Version identifier (v1.0, 2024-01-15, Q1-2024, etc.)
- `status` - Status enum (DRAFT, ACTIVE, ARCHIVED, DEPRECATED)
- **`curveTypes`** - **Array** of allowed curve types for this instance (e.g., ["Revenue Forecast", "P-Values"])
- **`commodities`** - **Array** of allowed commodities for this instance (e.g., ["EA Revenue", "AS Revenue", "Total Revenue"])
- **`scenarios`** - **Array** of allowed scenarios for this instance (e.g., ["BASE", "HIGH", "LOW", "P50"])
- `granularity` - Time granularity (HOURLY, DAILY, MONTHLY, QUARTERLY, ANNUAL)
- `degradationType` - Degradation type (NONE, YEAR_1, YEAR_5, etc.)
- `deliveryPeriodStart` - Start date for delivery period
- `deliveryPeriodEnd` - End date for delivery period
- `forecastRunDate` - Date when forecast was run
- `createdBy` - Creator identifier
- `modelType` - Model used (Aurora, Gridstor Regression, etc.)
- `modelVersion` - Model version identifier
- `notes` - Optional notes
- `metadata` - JSON field for additional data (includes units if provided in CSV)
- `createdAt`, `updatedAt` - Timestamps

**Relations:**
- `curveDefinition` - Many-to-one with CurveDefinition
- `curveData` - One-to-many with CurveData

**Important:** The array fields (`curveTypes`, `commodities`, `scenarios`) define which values are allowed in the CSV data. Each row in CurveData must have values that exist in these arrays.

#### CurveData
Stores the actual price forecast data points with categorization per row

**Key Fields:**
- `id` - Primary key
- `curveInstanceId` - Foreign key to CurveInstance
- `timestamp` - DateTime for the data point
- `value` - The actual numeric value
- **`curveType`** - Curve type for this row (must exist in instance's `curveTypes` array)
- **`commodity`** - Commodity for this row (must exist in instance's `commodities` array)
- **`scenario`** - Scenario for this row (must exist in instance's `scenarios` array)
- `units` - Units for this value ($/MWh, $/kW-month, etc.)
- `flags` - Array of flags/metadata
- `metadata` - JSON field for additional row-level data
- `createdAt`, `updatedAt` - Timestamps

**Relations:**
- `curveInstance` - Many-to-one with CurveInstance

**Important:** Each row can have a different combination of (curveType, commodity, scenario), allowing flexible multi-dimensional data storage. All values must be validated against the instance's array fields.

## Upload Workflow

### 1. Create/Select Curve Definition
- Create new or select existing definition
- Required: curveName, market, location, batteryDuration
- Optional: product, units, timezone, description, createdBy

### 2. Create/Select Curve Instance
- Create new or select existing instance for the definition
- Required: instanceVersion, deliveryPeriodStart, deliveryPeriodEnd
- **Required Arrays**: curveTypes[], commodities[], scenarios[] - Define allowed values for CSV data
- Optional: modelType, createdBy, notes, granularity, degradationType

### 3. Upload Curve Data
- Upload CSV with columns: timestamp, value, curveType, commodity, scenario, units (optional)
- System validates that each row's curveType/commodity/scenario exists in instance arrays
- Validates timestamps are within delivery period
- Deletes existing data for instance before inserting new data
- Updates instance status to ACTIVE

## CSV Format

```csv
timestamp,value,curveType,commodity,scenario,units
2024-01-01T00:00:00Z,45.50,Revenue Forecast,EA Revenue,BASE,$/MWh
2024-01-01T00:00:00Z,42.30,Revenue Forecast,EA Revenue,LOW,$/MWh
2024-01-01T00:00:00Z,48.75,Revenue Forecast,EA Revenue,HIGH,$/MWh
2024-01-01T00:00:00Z,38.75,Revenue Forecast,AS Revenue,BASE,$/MWh
2024-01-01T00:00:00Z,35.20,Revenue Forecast,AS Revenue,LOW,$/MWh
2024-01-01T00:00:00Z,87.25,Revenue Forecast,Total Revenue,BASE,$/MWh
2024-01-01T01:00:00Z,44.80,Revenue Forecast,EA Revenue,BASE,$/MWh
```

**Important:** Each row's curveType, commodity, and scenario values must exist in the CurveInstance's corresponding array fields.

## API Endpoints

### Curve Upload
- `POST /api/curve-upload/create-definition` - Create curve definition
- `POST /api/curve-upload/create-instance` - Create curve instance
- `POST /api/curve-upload/upload-data` - Upload price data

### Curve Queries
- `GET /api/curves/definitions` - List all curve definitions
- `GET /api/curves/instances?definitionId={id}` - List instances for a definition
- `GET /api/curves/{id}/data` - Get price data for an instance
- `GET /api/curves/list` - List all curves with instances

## Notes

- Multiple combinations of (curveType, commodity, scenario) can be uploaded in a single CSV file
- Each row can have a different combination, allowing flexible multi-dimensional data
- CurveInstance arrays define which values are allowed (validation whitelist)
- If instance arrays are empty, no validation is performed for that field
- Units can be specified per-row in CSV or inherited from definition
- Timestamps must be within the instance's delivery period
- Data is replaced (not appended) when uploading to an existing instance
- One instance can contain multiple curve types and commodities together
