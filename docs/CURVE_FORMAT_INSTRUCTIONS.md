# Price Curve Formatting Instructions for Database Upload

## Overview

This document provides **exact field requirements** and database structure information for formatting price curves into CSVs that can be uploaded to the database. The database uses a three-tier structure: **CurveDefinition → CurveInstance → CurveData**.

---

## Database Structure

### Three-Tier Architecture

1. **CurveDefinition** - Defines the metadata for a price curve (market, location, battery specs)
2. **CurveInstance** - Represents a specific version/run of a curve definition (with delivery periods, scenarios, etc.)
3. **CurveData** - Stores the actual price forecast data points

### Database Relationships

```
CurveDefinition (1) ──→ (many) CurveInstance (1) ──→ (many) CurveData
```

- One CurveDefinition can have multiple CurveInstances (different versions/runs)
- One CurveInstance can have multiple CurveData rows (different timestamps/combinations)

---

## Step 1: Curve Definition Fields

### Required Fields for CurveDefinition

| Field | Type | Required | Description | Examples |
|-------|------|----------|-------------|-----------|
| `curveName` | String (unique) | ✅ **YES** | Unique name for the curve | "CAISO_NP15_4H_Q1_2025", "ERCOT_Houston_2H_Revenue" |
| `market` | String (50 chars) | ✅ **YES** | Market identifier | "CAISO", "ERCOT", "PJM", "NYISO" |
| `location` | String (100 chars) | ✅ **YES** | Location/node identifier | "NP15", "SP15", "Channel View", "Houston" |
| `locationType` | Enum (HUB or NODE) | No | Type of location - HUB for hub-level pricing, NODE for nodal pricing | "HUB", "NODE" |
| `batteryDuration` | String (50 chars) | ✅ **YES** | Battery duration | "TWO_H", "FOUR_H", "EIGHT_H", "UNKNOWN" |
| `units` | String (50 chars) | No (default: "$/MWh") | Units for the curve | "$/MWh", "$/kW-month" |
| `timezone` | String (50 chars) | No (default: "UTC") | Timezone for timestamps | "UTC", "America/Los_Angeles" |
| `description` | Text | No | Optional description | "Q1 2025 revenue forecast for NP15" |
| `createdBy` | String (100 chars) | No | Creator identifier | "Upload System", "John Doe" |

### Important Notes:

- **`curveName` must be UNIQUE** - if a definition with the same name exists, it will be reused (not duplicated)
- **`product` field is legacy/optional** - kept for DB compatibility but not required
- **`locationType`** - Distinguishes hub-level pricing (HUB) from nodal pricing (NODE). Common nodes include: Goleta, Santa Fe Springs, Hidden Lakes, Gunnar, Odessa. Common hubs include: SP15, NP15, Houston, North Hub, South Hub. Used in graphing and analysis.
- Fields like `curveType`, `commodity`, `granularity`, `scenario`, `degradationType` are **NOT** on CurveDefinition - they're on CurveInstance

---

## Step 2: Curve Instance Fields

### Required Fields for CurveInstance

| Field | Type | Required | Description | Examples |
|-------|------|----------|-------------|-----------|
| `curveDefinitionId` | Integer | ✅ **YES** | Foreign key to CurveDefinition (get from Step 1) | 1, 2, 3... |
| `instanceVersion` | String (50 chars) | ✅ **YES** | Version identifier (must be unique per definition) | "v1.0", "2024-01-15", "Q1-2024", "2025-01-15_RUN1" |
| `deliveryPeriodStart` | DateTime | ✅ **YES** | Start date for delivery period | "2025-01-01T00:00:00Z" |
| `deliveryPeriodEnd` | DateTime | ✅ **YES** | End date for delivery period | "2025-03-31T23:59:59Z" |
| `forecastRunDate` | DateTime | ✅ **YES** | Date when forecast was run | "2025-01-15T10:00:00Z" |
| `createdBy` | String (100 chars) | ✅ **YES** | Creator identifier | "Upload System" |

### Multi-Value Array Fields (CRITICAL!)

These fields accept **arrays** of values and act as **validation whitelists**. Each row in your CSV data must have curveType, commodity, and scenario values that exist in these arrays:

| Field | Type | Required | Description | Examples |
|-------|------|----------|-------------|-----------|
| `curveTypes` | String Array | **YES** (can be empty) | Array of allowed curve types - CSV rows must match | `["Revenue Forecast", "P-Values"]` |
| `commodities` | String Array | **YES** (can be empty) | Array of allowed commodities - CSV rows must match | `["EA Revenue", "AS Revenue", "Total Revenue"]` |
| `scenarios` | String Array | **YES** (can be empty) | Array of allowed scenarios - CSV rows must match | `["BASE", "HIGH", "LOW", "P5", "P25", "P50", "P75", "P95"]` |

**IMPORTANT:** If an array is empty `[]`, no validation is performed for that field. If an array has values, every CSV row must have a value that exists in the array or the upload will fail.

### Optional Fields for CurveInstance

| Field | Type | Required | Description | Examples |
|-------|------|----------|-------------|-----------|
| `granularity` | String (20 chars) | No | Time granularity | "HOURLY", "DAILY", "MONTHLY", "QUARTERLY", "ANNUAL" |
| `degradationType` | String (100 chars) | No | Degradation type | "NONE", "YEAR_1", "YEAR_5" |
| `freshnessStartDate` | DateTime | No (defaults to forecastRunDate) | Freshness period start | "2025-01-15T00:00:00Z" |
| `freshnessEndDate` | DateTime | No | Freshness period end | "2025-03-31T23:59:59Z" |
| `modelType` | String (100 chars) | No | Model used | "Aurora", "Gridstor Regression" |
| `modelVersion` | String (50 chars) | No | Model version | "v2.1" |
| `notes` | Text | No | Optional notes | "Initial upload for Q1 2025" |
| `runType` | Enum | No (default: "MANUAL") | Type of run | "MANUAL", "SCHEDULED", "BACKFILL" |

### Critical Instance Rules:

1. **`instanceVersion` must be unique per CurveDefinition** - if you try to create a duplicate, it will fail
2. **Multi-value arrays ARE VALIDATION WHITELISTS** (`curveTypes`, `commodities`, `scenarios`):
   - These arrays must contain ALL unique values that will appear in your CSV data
   - The upload endpoint validates each CSV row against these arrays
   - If a CSV row has a curveType/commodity/scenario not in the arrays, the upload fails
   - If an array is empty, no validation occurs for that field
3. **Dates must be valid**:
   - `deliveryPeriodStart` must be before `deliveryPeriodEnd`
   - All timestamps in CSV data must fall within the delivery period

---

## Step 3: Curve Data CSV Format

### CSV Column Requirements

The CSV file must have these **exact columns** (in this order recommended):

| Column | Type | Required | Description | Format Examples |
|--------|------|----------|-------------|-----------------|
| `timestamp` | DateTime | ✅ **YES** | Date/time for the data point | "2025-01-01T00:00:00Z", "2025-01-01T01:00:00Z" |
| `value` | Float | ✅ **YES** | Numeric price value | 45.50, 123.75, -10.25 |
| `curveType` | String | ✅ **YES** | Must match value in instance `curveTypes` array | "Revenue Forecast", "P-Values" |
| `commodity` | String | ✅ **YES** | Must match value in instance `commodities` array | "EA Revenue", "AS Revenue", "Total Revenue" |
| `scenario` | String | ✅ **YES** | Must match value in instance `scenarios` array | "BASE", "HIGH", "LOW", "P5", "P25", "P50" |
| `units` | String | No | Units (optional, inherits from definition if not provided) | "$/MWh", "$/kW-month" |

### CSV Format Example

```csv
timestamp,value,curveType,commodity,scenario,units
2025-01-01T00:00:00Z,45.50,Revenue Forecast,EA Revenue,BASE,$/MWh
2025-01-01T00:00:00Z,42.30,Revenue Forecast,EA Revenue,LOW,$/MWh
2025-01-01T00:00:00Z,48.75,Revenue Forecast,EA Revenue,HIGH,$/MWh
2025-01-01T00:00:00Z,38.75,Revenue Forecast,AS Revenue,BASE,$/MWh
2025-01-01T00:00:00Z,35.20,Revenue Forecast,AS Revenue,LOW,$/MWh
2025-01-01T00:00:00Z,87.25,Revenue Forecast,Total Revenue,BASE,$/MWh
2025-01-01T01:00:00Z,44.80,Revenue Forecast,EA Revenue,BASE,$/MWh
2025-01-01T01:00:00Z,41.50,Revenue Forecast,EA Revenue,LOW,$/MWh
```

**For this CSV, the CurveInstance arrays must be:**
```json
{
  "curveTypes": ["Revenue Forecast"],
  "commodities": ["EA Revenue", "AS Revenue", "Total Revenue"],
  "scenarios": ["BASE", "LOW", "HIGH"]
}
```

### CSV Validation Rules

1. **Timestamp format**: Must be ISO 8601 format (e.g., `2025-01-01T00:00:00Z`)
2. **Timestamp range**: All timestamps must fall within `deliveryPeriodStart` and `deliveryPeriodEnd` of the instance
3. **Value**: Must be a valid number (can be negative, decimals allowed)
4. **curveType validation**: 
   - **REQUIRED** in every CSV row
   - Must exist in the instance's `curveTypes` array (if array is not empty)
   - Validation skipped only if instance array is empty `[]`
5. **commodity validation**: 
   - **REQUIRED** in every CSV row
   - Must exist in the instance's `commodities` array (if array is not empty)
   - Validation skipped only if instance array is empty `[]`
6. **scenario validation**: 
   - **REQUIRED** in every CSV row
   - Must exist in the instance's `scenarios` array (if array is not empty)
   - Validation skipped only if instance array is empty `[]`
7. **Empty values**: Rows with empty `value` field are skipped (not an error)

### Important CSV Notes:

- **Multiple rows per timestamp**: Different combinations of `(timestamp, curveType, commodity, scenario)` are allowed and expected
- **Flexible multi-dimensional data**: One instance can contain multiple curve types, commodities, and scenarios together
- **Array validation is strict**: Upload fails if any CSV row has values not in the instance arrays
- **Data replacement**: Uploading to an existing instance **deletes all existing data** for that instance first, then inserts new data
- **Instance status**: After successful upload, the instance status is automatically set to `ACTIVE`
- **One row = one data point**: Each CSV row creates one CurveData record with its specific curveType/commodity/scenario

---

## Complete Upload Workflow

### Process for Each Curve:

1. **Create/Get CurveDefinition**
   - Check if definition exists by `curveName`
   - If not exists, create with: `curveName`, `market`, `location`, `batteryDuration` (+ optional fields)
   - Save the `curveDefinitionId` returned

2. **Create CurveInstance**
   - Use the `curveDefinitionId` from step 1
   - Provide: `instanceVersion`, `deliveryPeriodStart`, `deliveryPeriodEnd`, `forecastRunDate`, `createdBy`
   - **CRITICAL**: Populate `curveTypes`, `commodities`, `scenarios` arrays with ALL unique values that will appear in your CSV
   - These arrays act as validation whitelists - CSV upload will fail if rows contain values not in these arrays
   - If you set an array to empty `[]`, validation is skipped for that field
   - Save the `curveInstanceId` returned

3. **Format CSV Data**
   - Ensure CSV has columns: `timestamp`, `value`, `curveType`, `commodity`, `scenario`, `units`
   - Ensure all `curveType`, `commodity`, `scenario` values match the arrays defined in step 2
   - Ensure all timestamps are within the delivery period
   - Ensure all values are numeric

4. **Upload CSV Data**
   - Use the `curveInstanceId` from step 2
   - Parse CSV and send as JSON array to upload endpoint
   - System validates, deletes existing data, inserts new data, sets status to ACTIVE

---

## API Endpoints Reference

### 1. Create Curve Definition
**Endpoint**: `POST /api/curve-upload/create-definition`

**Request Body**:
```json
{
  "curveName": "CAISO_NP15_4H_Q1_2025",
  "market": "CAISO",
  "location": "NP15",
  "batteryDuration": "FOUR_H",
  "units": "$/MWh",
  "timezone": "UTC",
  "description": "Q1 2025 revenue forecast",
  "createdBy": "Upload System"
}
```

**Response**:
```json
{
  "success": true,
  "curveDefinition": {
    "id": 1,
    "curveName": "CAISO_NP15_4H_Q1_2025",
    ...
  },
  "isNew": true
}
```

### 2. Create Curve Instance
**Endpoint**: `POST /api/curve-upload/create-instance`

**Request Body**:
```json
{
  "curveDefinitionId": 1,
  "instanceVersion": "2025-01-15_RUN1",
  "deliveryPeriodStart": "2025-01-01T00:00:00Z",
  "deliveryPeriodEnd": "2025-03-31T23:59:59Z",
  "forecastRunDate": "2025-01-15T10:00:00Z",
  "createdBy": "Upload System",
  "curveTypes": ["Revenue Forecast"],
  "commodities": ["EA Revenue", "AS Revenue", "Total Revenue"],
  "scenarios": ["BASE", "HIGH", "LOW"],
  "granularity": "HOURLY",
  "modelType": "Aurora",
  "notes": "Initial upload"
}
```

**Response**:
```json
{
  "success": true,
  "curveInstance": {
    "id": 1,
    "curveDefinitionId": 1,
    "instanceVersion": "2025-01-15_RUN1",
    ...
  }
}
```

### 3. Upload Curve Data
**Endpoint**: `POST /api/curve-upload/upload-data`

**Request Body**:
```json
{
  "curveInstanceId": 1,
  "priceData": [
    {
      "timestamp": "2025-01-01T00:00:00Z",
      "value": 45.50,
      "curveType": "Revenue Forecast",
      "commodity": "EA Revenue",
      "scenario": "BASE",
      "units": "$/MWh"
    },
    {
      "timestamp": "2025-01-01T00:00:00Z",
      "value": 42.30,
      "curveType": "Revenue Forecast",
      "commodity": "EA Revenue",
      "scenario": "LOW",
      "units": "$/MWh"
    }
    // ... more rows
  ]
}
```

**Response**:
```json
{
  "success": true,
  "recordsCreated": 1464,
  "curveInstance": {
    "id": 1,
    "curveName": "CAISO_NP15_4H_Q1_2025",
    "instanceVersion": "2025-01-15_RUN1"
  }
}
```

---

## Common Issues and Solutions

### Issue: "curveType not in instance types"
**Cause**: The CSV has a curveType value that doesn't exist in the instance's `curveTypes` array  
**Solution**: 
1. Check what curveType values are in your CSV
2. Update the instance's `curveTypes` array to include ALL unique curveType values from your CSV
3. Re-upload the data

**Example Error:**
```
Row 5: curveType "Price Forecast" not in instance types: [Revenue Forecast]
```
**Fix:** Add "Price Forecast" to the curveTypes array

### Issue: "commodity not in instance commodities"
**Cause**: The CSV has a commodity value that doesn't exist in the instance's `commodities` array  
**Solution**: 
1. Check what commodity values are in your CSV
2. Update the instance's `commodities` array to include ALL unique commodity values from your CSV
3. Re-upload the data

**Example Error:**
```
Row 12: commodity "REC Revenue" not in instance commodities: [EA Revenue, AS Revenue]
```
**Fix:** Add "REC Revenue" to the commodities array

### Issue: "scenario not in instance scenarios"
**Cause**: The CSV has a scenario value that doesn't exist in the instance's `scenarios` array  
**Solution**: 
1. Check what scenario values are in your CSV
2. Update the instance's `scenarios` array to include ALL unique scenario values from your CSV
3. Re-upload the data

**Example Error:**
```
Row 8: scenario "P90" not in instance scenarios: [BASE, HIGH, LOW]
```
**Fix:** Add "P90" to the scenarios array

### Issue: "Timestamp outside delivery period"
**Solution**: All CSV timestamps must fall between `deliveryPeriodStart` and `deliveryPeriodEnd`

### Issue: "Instance version already exists"
**Solution**: Each `instanceVersion` must be unique per CurveDefinition. Use a different version string or check if instance already exists

### Issue: "Missing required fields"
**Solution**: Ensure all required fields are provided:
- CurveDefinition: `curveName`, `market`, `location`, `batteryDuration`
- CurveInstance: `curveDefinitionId`, `instanceVersion`, `deliveryPeriodStart`, `deliveryPeriodEnd`, `forecastRunDate`, `createdBy`
- CSV: `timestamp`, `value`, `curveType`, `commodity`, `scenario`

---

## Formatting Checklist for Each Curve

- [ ] **CurveDefinition identified/created**
  - [ ] `curveName` is unique and descriptive
  - [ ] `market` is set correctly
  - [ ] `location` is set correctly
  - [ ] `batteryDuration` is set correctly
  - [ ] `units` is set (or using default "$/MWh")
  - [ ] `timezone` is set (or using default "UTC")

- [ ] **CurveInstance created**
  - [ ] `curveDefinitionId` retrieved from step 1
  - [ ] `instanceVersion` is unique and descriptive
  - [ ] `deliveryPeriodStart` and `deliveryPeriodEnd` cover all CSV timestamps
  - [ ] `forecastRunDate` is set
  - [ ] `createdBy` is set
  - [ ] `curveTypes` array contains ALL unique curveType values from CSV
  - [ ] `commodities` array contains ALL unique commodity values from CSV
  - [ ] `scenarios` array contains ALL unique scenario values from CSV
  - [ ] `granularity` matches data frequency (if known)

- [ ] **CSV formatted correctly**
  - [ ] Has header row: `timestamp,value,curveType,commodity,scenario,units`
  - [ ] All timestamps are ISO 8601 format
  - [ ] All timestamps fall within delivery period
  - [ ] All values are numeric
  - [ ] All `curveType` values match instance `curveTypes` array
  - [ ] All `commodity` values match instance `commodities` array
  - [ ] All `scenario` values match instance `scenarios` array
  - [ ] CSV is properly encoded (UTF-8)

- [ ] **Upload ready**
  - [ ] `curveInstanceId` retrieved from step 2
  - [ ] CSV parsed into JSON array format
  - [ ] Ready to call upload endpoint

---

## Example: Complete Workflow for One Curve

```python
# Step 1: Create/Get Definition
definition_response = POST("/api/curve-upload/create-definition", {
    "curveName": "ERCOT_Houston_2H_Revenue_Q1_2025",
    "market": "ERCOT",
    "location": "Houston",
    "batteryDuration": "TWO_H",
    "units": "$/MWh",
    "createdBy": "Upload System"
})
definition_id = definition_response["curveDefinition"]["id"]

# Step 2: Create Instance
instance_response = POST("/api/curve-upload/create-instance", {
    "curveDefinitionId": definition_id,
    "instanceVersion": "2025-01-15_v1",
    "deliveryPeriodStart": "2025-01-01T00:00:00Z",
    "deliveryPeriodEnd": "2025-03-31T23:59:59Z",
    "forecastRunDate": "2025-01-15T10:00:00Z",
    "createdBy": "Upload System",
    "curveTypes": ["Revenue Forecast"],
    "commodities": ["EA Revenue", "Total Revenue"],
    "scenarios": ["BASE", "P50"],
    "granularity": "HOURLY"
})
instance_id = instance_response["curveInstance"]["id"]

# Step 3: Upload CSV Data
csv_data = [
    {"timestamp": "2025-01-01T00:00:00Z", "value": 45.50, "curveType": "Revenue Forecast", "commodity": "EA Revenue", "scenario": "BASE", "units": "$/MWh"},
    {"timestamp": "2025-01-01T00:00:00Z", "value": 52.75, "curveType": "Revenue Forecast", "commodity": "EA Revenue", "scenario": "P50", "units": "$/MWh"},
    {"timestamp": "2025-01-01T01:00:00Z", "value": 44.80, "curveType": "Revenue Forecast", "commodity": "EA Revenue", "scenario": "BASE", "units": "$/MWh"},
    # ... more rows
]

upload_response = POST("/api/curve-upload/upload-data", {
    "curveInstanceId": instance_id,
    "priceData": csv_data
})
```

---

## Summary

**Three key things to remember:**

1. **CurveDefinition** = Market + Location + Battery specs (metadata)
   - One definition can have multiple instances with different types/commodities
2. **CurveInstance** = Specific run with delivery period + **validation arrays**
   - Arrays (`curveTypes`, `commodities`, `scenarios`) define allowed values
   - These act as whitelists - CSV rows must match these values
3. **CurveData CSV** = One row per (timestamp, curveType, commodity, scenario) combination
   - Each row must have values that exist in the instance arrays
   - Multiple rows per timestamp are normal and expected

**Critical validation:** All `curveType`, `commodity`, and `scenario` values in CSV must exist in the instance's respective arrays. Upload fails if any row has values not in the arrays.

