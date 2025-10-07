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
- `deliveryPeriodStart` - Start date for delivery period
- `deliveryPeriodEnd` - End date for delivery period
- `forecastRunDate` - Date when forecast was run
- `createdBy` - Creator identifier
- `modelType` - Model used (Aurora, Gridstor Regression, etc.)
- `notes` - Optional notes
- `metadata` - JSON field for additional data (includes units if provided in CSV)
- `createdAt`, `updatedAt` - Timestamps

**Relations:**
- `curveDefinition` - Many-to-one with CurveDefinition
- `curveData` - One-to-many with CurveData

#### CurveData
Stores the actual price forecast data points with multiple p-values

**Key Fields:**
- `id` - Primary key
- `curveInstanceId` - Foreign key to CurveInstance
- `timestamp` - DateTime for the data point
- `valueP5` - P5 value (nullable)
- `valueP25` - P25 value (nullable)
- `valueP50` - P50 value (required, also stored in legacy `value` field)
- `valueP75` - P75 value (nullable)
- `valueP95` - P95 value (nullable)
- `flags` - Array of flags/metadata
- `createdAt`, `updatedAt` - Timestamps

**Relations:**
- `curveInstance` - Many-to-one with CurveInstance

**Unique Constraint:** (curveInstanceId, timestamp)

## Upload Workflow

### 1. Create/Select Curve Definition
- Create new or select existing definition
- Required: curveName, market, location, product, curveType, granularity, units

### 2. Create/Select Curve Instance
- Create new or select existing instance for the definition
- Required: instanceVersion, deliveryPeriodStart, deliveryPeriodEnd
- Optional: modelType, createdBy, notes

### 3. Upload Curve Data
- Upload CSV with columns: timestamp, value, pvalue (optional, default 50), units (optional)
- System groups by timestamp and consolidates p-values
- Validates timestamps are within delivery period
- Deletes existing data for instance before inserting new data
- Updates instance status to ACTIVE

## CSV Format

```csv
timestamp,value,pvalue,units
2024-01-01T00:00:00Z,45.50,5,$/MWh
2024-01-01T00:00:00Z,48.25,25,$/MWh
2024-01-01T00:00:00Z,52.75,50,$/MWh
2024-01-01T00:00:00Z,57.10,75,$/MWh
2024-01-01T00:00:00Z,62.20,95,$/MWh
```

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

- Multiple p-values can be uploaded in a single CSV file
- Each timestamp can have P5, P25, P50, P75, P95 values
- P50 is required (falls back to any available p-value if not provided)
- Units can be specified per-row in CSV or inherited from definition
- Timestamps must be within the instance's delivery period
- Data is replaced (not appended) when uploading to an existing instance
