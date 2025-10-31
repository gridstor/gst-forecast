-- Migration: Create Forecasts Schema Tables
-- Date: 2025-10-28
-- Purpose: Create all tables for the new CurveDefinition/CurveInstance architecture

-- ========== CREATE ENUMS (IF NOT EXISTS) ==========

DO $$ BEGIN
  CREATE TYPE "Forecasts"."InstanceStatus" AS ENUM (
    'DRAFT',
    'PENDING_APPROVAL',
    'APPROVED',
    'ACTIVE',
    'SUPERSEDED',
    'EXPIRED',
    'FAILED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "Forecasts"."RunType" AS ENUM (
    'MANUAL',
    'SCHEDULED',
    'TRIGGERED',
    'BACKFILL',
    'CORRECTION'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "Forecasts"."ScheduleType" AS ENUM (
    'REGULAR',
    'AD_HOC',
    'TRIGGERED',
    'EVENT_BASED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "Forecasts"."UpdateFrequency" AS ENUM (
    'HOURLY',
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'QUARTERLY',
    'ANNUALLY',
    'ON_DEMAND'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ========== CREATE TABLES ==========

-- CurveDefinition: Core curve metadata (Market + Location + Battery specs)
CREATE TABLE IF NOT EXISTS "Forecasts"."CurveDefinition" (
  "id" SERIAL PRIMARY KEY,
  "curveName" VARCHAR(255) UNIQUE NOT NULL,
  "market" VARCHAR(50) NOT NULL,
  "location" VARCHAR(100) NOT NULL,
  "product" VARCHAR(100), -- Optional legacy field
  "batteryDuration" VARCHAR(50) NOT NULL DEFAULT 'UNKNOWN',
  "units" VARCHAR(50) NOT NULL DEFAULT '$/MWh',
  "timezone" VARCHAR(50) NOT NULL DEFAULT 'UTC',
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" VARCHAR(100)
);

-- CurveInstance: Specific forecast runs with instance-level characteristics
CREATE TABLE IF NOT EXISTS "Forecasts"."CurveInstance" (
  "id" SERIAL PRIMARY KEY,
  "curveDefinitionId" INTEGER NOT NULL,
  "instanceVersion" VARCHAR(50) NOT NULL,
  "curveType" VARCHAR(100),
  "commodity" VARCHAR(50),
  "granularity" VARCHAR(20),
  "scenario" VARCHAR(100),
  "degradationType" VARCHAR(100),
  "deliveryPeriodStart" TIMESTAMPTZ(6) NOT NULL,
  "deliveryPeriodEnd" TIMESTAMPTZ(6) NOT NULL,
  "forecastRunDate" TIMESTAMPTZ(6) NOT NULL,
  "freshnessStartDate" TIMESTAMPTZ(6) NOT NULL,
  "freshnessEndDate" TIMESTAMPTZ(6),
  "status" "Forecasts"."InstanceStatus" NOT NULL DEFAULT 'DRAFT',
  "modelType" VARCHAR(100),
  "modelVersion" VARCHAR(50),
  "runType" "Forecasts"."RunType" NOT NULL DEFAULT 'MANUAL',
  "createdBy" VARCHAR(100) NOT NULL,
  "approvedBy" VARCHAR(100),
  "approvedAt" TIMESTAMPTZ(6),
  "notes" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CurveInstance_curveDefinitionId_fkey" 
    FOREIGN KEY ("curveDefinitionId") REFERENCES "Forecasts"."CurveDefinition"("id") ON DELETE CASCADE,
  CONSTRAINT "CurveInstance_curveDefinitionId_instanceVersion_key" 
    UNIQUE ("curveDefinitionId", "instanceVersion")
);

-- PriceForecast: Actual price data points
CREATE TABLE IF NOT EXISTS "Forecasts"."PriceForecast" (
  "id" SERIAL PRIMARY KEY,
  "curveInstanceId" INTEGER NOT NULL,
  "flow_date_start" TIMESTAMPTZ(6) NOT NULL,
  "flow_date_end" TIMESTAMPTZ(6),
  "valueP5" DECIMAL(10, 2),
  "valueP25" DECIMAL(10, 2),
  "valueP50" DECIMAL(10, 2),
  "valueP75" DECIMAL(10, 2),
  "valueP95" DECIMAL(10, 2),
  "units" VARCHAR(20),
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PriceForecast_curveInstanceId_fkey" 
    FOREIGN KEY ("curveInstanceId") REFERENCES "Forecasts"."CurveInstance"("id") ON DELETE CASCADE
);

-- CurveData: Alternative price data storage (if needed)
CREATE TABLE IF NOT EXISTS "Forecasts"."CurveData" (
  "id" SERIAL PRIMARY KEY,
  "curveInstanceId" INTEGER NOT NULL,
  "timestamp" TIMESTAMPTZ(6) NOT NULL,
  "value" DECIMAL(15, 4) NOT NULL,
  "pValue" INTEGER,
  "units" VARCHAR(20),
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CurveData_curveInstanceId_fkey" 
    FOREIGN KEY ("curveInstanceId") REFERENCES "Forecasts"."CurveInstance"("id") ON DELETE CASCADE
);

-- CurveSchedule: Delivery schedules and requests
CREATE TABLE IF NOT EXISTS "Forecasts"."CurveSchedule" (
  "id" SERIAL PRIMARY KEY,
  "curveDefinitionId" INTEGER NOT NULL,
  "scheduleType" "Forecasts"."ScheduleType" NOT NULL DEFAULT 'REGULAR',
  "frequency" "Forecasts"."UpdateFrequency" NOT NULL,
  "dayOfWeek" INTEGER,
  "dayOfMonth" INTEGER,
  "timeOfDay" TIME NOT NULL DEFAULT '09:00:00',
  "leadTimeDays" INTEGER NOT NULL DEFAULT 0,
  "freshnessDays" INTEGER NOT NULL DEFAULT 30,
  "responsibleTeam" VARCHAR(100) NOT NULL DEFAULT 'Market Analysis',
  "notificationEmails" TEXT[],
  "importance" INTEGER NOT NULL DEFAULT 3,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "validFrom" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "validUntil" TIMESTAMPTZ(6),
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CurveSchedule_curveDefinitionId_fkey" 
    FOREIGN KEY ("curveDefinitionId") REFERENCES "Forecasts"."CurveDefinition"("id") ON DELETE CASCADE
);

-- ScheduleRun: Individual execution records
CREATE TABLE IF NOT EXISTS "Forecasts"."ScheduleRun" (
  "id" SERIAL PRIMARY KEY,
  "scheduleId" INTEGER NOT NULL,
  "runDate" TIMESTAMPTZ(6) NOT NULL,
  "runType" "Forecasts"."RunType" NOT NULL DEFAULT 'SCHEDULED',
  "instancesCreated" INTEGER NOT NULL DEFAULT 0,
  "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  "startedAt" TIMESTAMPTZ(6),
  "completedAt" TIMESTAMPTZ(6),
  "metadata" JSONB,
  CONSTRAINT "ScheduleRun_scheduleId_fkey" 
    FOREIGN KEY ("scheduleId") REFERENCES "Forecasts"."CurveSchedule"("id") ON DELETE CASCADE
);

-- CurveInputLineage: Track data sources
CREATE TABLE IF NOT EXISTS "Forecasts"."CurveInputLineage" (
  "id" SERIAL PRIMARY KEY,
  "curveInstanceId" INTEGER NOT NULL,
  "inputType" VARCHAR(50) NOT NULL,
  "sourceFile" VARCHAR(500),
  "sourceCurveId" INTEGER,
  "sourceTimestamp" TIMESTAMPTZ(6),
  "dataHash" VARCHAR(64),
  "recordCount" INTEGER,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CurveInputLineage_curveInstanceId_fkey" 
    FOREIGN KEY ("curveInstanceId") REFERENCES "Forecasts"."CurveInstance"("id") ON DELETE CASCADE
);

-- VersionHistory: Track version changes
CREATE TABLE IF NOT EXISTS "Forecasts"."VersionHistory" (
  "id" SERIAL PRIMARY KEY,
  "curveDefinitionId" INTEGER NOT NULL,
  "currentInstanceId" INTEGER NOT NULL,
  "previousInstanceId" INTEGER,
  "changeType" VARCHAR(50) NOT NULL,
  "changeReason" TEXT,
  "changedBy" VARCHAR(100) NOT NULL,
  "changedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  CONSTRAINT "VersionHistory_curveDefinitionId_fkey" 
    FOREIGN KEY ("curveDefinitionId") REFERENCES "Forecasts"."CurveDefinition"("id") ON DELETE CASCADE,
  CONSTRAINT "VersionHistory_currentInstanceId_fkey" 
    FOREIGN KEY ("currentInstanceId") REFERENCES "Forecasts"."CurveInstance"("id") ON DELETE CASCADE,
  CONSTRAINT "VersionHistory_previousInstanceId_fkey" 
    FOREIGN KEY ("previousInstanceId") REFERENCES "Forecasts"."CurveInstance"("id") ON DELETE SET NULL
);

-- QualityMetric: Track data quality scores
CREATE TABLE IF NOT EXISTS "Forecasts"."QualityMetric" (
  "id" SERIAL PRIMARY KEY,
  "curveInstanceId" INTEGER NOT NULL,
  "metricType" VARCHAR(50) NOT NULL,
  "metricValue" DECIMAL(10, 4) NOT NULL,
  "threshold" DECIMAL(10, 4),
  "passed" BOOLEAN NOT NULL DEFAULT true,
  "details" JSONB,
  "calculatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QualityMetric_curveInstanceId_fkey" 
    FOREIGN KEY ("curveInstanceId") REFERENCES "Forecasts"."CurveInstance"("id") ON DELETE CASCADE
);

-- DefaultCurveInput: Template inputs for new instances
CREATE TABLE IF NOT EXISTS "Forecasts"."DefaultCurveInput" (
  "id" SERIAL PRIMARY KEY,
  "curveDefinitionId" INTEGER NOT NULL,
  "inputKey" VARCHAR(100) NOT NULL,
  "inputValue" TEXT NOT NULL,
  "dataType" VARCHAR(20) NOT NULL DEFAULT 'string',
  "isRequired" BOOLEAN NOT NULL DEFAULT false,
  "description" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DefaultCurveInput_curveDefinitionId_fkey" 
    FOREIGN KEY ("curveDefinitionId") REFERENCES "Forecasts"."CurveDefinition"("id") ON DELETE CASCADE,
  CONSTRAINT "DefaultCurveInput_curveDefinitionId_inputKey_key" 
    UNIQUE ("curveDefinitionId", "inputKey")
);

-- CurveInstanceTemplate: Reusable instance configurations
CREATE TABLE IF NOT EXISTS "Forecasts"."CurveInstanceTemplate" (
  "id" SERIAL PRIMARY KEY,
  "scheduleId" INTEGER NOT NULL,
  "templateName" VARCHAR(100) NOT NULL,
  "curveType" VARCHAR(100),
  "commodity" VARCHAR(50),
  "granularity" VARCHAR(20),
  "scenario" VARCHAR(100),
  "degradationType" VARCHAR(100),
  "modelType" VARCHAR(100),
  "defaultInputs" JSONB,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CurveInstanceTemplate_scheduleId_fkey" 
    FOREIGN KEY ("scheduleId") REFERENCES "Forecasts"."CurveSchedule"("id") ON DELETE CASCADE
);

-- ========== CREATE INDEXES ==========

-- CurveDefinition indexes
CREATE INDEX IF NOT EXISTS "CurveDefinition_market_location_idx" ON "Forecasts"."CurveDefinition"("market", "location");
CREATE INDEX IF NOT EXISTS "CurveDefinition_batteryDuration_idx" ON "Forecasts"."CurveDefinition"("batteryDuration");
CREATE INDEX IF NOT EXISTS "CurveDefinition_isActive_idx" ON "Forecasts"."CurveDefinition"("isActive");
CREATE INDEX IF NOT EXISTS "CurveDefinition_createdAt_idx" ON "Forecasts"."CurveDefinition"("createdAt");

-- CurveInstance indexes
CREATE INDEX IF NOT EXISTS "CurveInstance_curveDefinitionId_idx" ON "Forecasts"."CurveInstance"("curveDefinitionId");
CREATE INDEX IF NOT EXISTS "CurveInstance_status_idx" ON "Forecasts"."CurveInstance"("status");
CREATE INDEX IF NOT EXISTS "CurveInstance_curveType_commodity_idx" ON "Forecasts"."CurveInstance"("curveType", "commodity");
CREATE INDEX IF NOT EXISTS "CurveInstance_granularity_scenario_idx" ON "Forecasts"."CurveInstance"("granularity", "scenario");
CREATE INDEX IF NOT EXISTS "CurveInstance_freshnessStartDate_freshnessEndDate_idx" ON "Forecasts"."CurveInstance"("freshnessStartDate", "freshnessEndDate");
CREATE INDEX IF NOT EXISTS "CurveInstance_deliveryPeriodStart_deliveryPeriodEnd_idx" ON "Forecasts"."CurveInstance"("deliveryPeriodStart", "deliveryPeriodEnd");
CREATE INDEX IF NOT EXISTS "CurveInstance_forecastRunDate_idx" ON "Forecasts"."CurveInstance"("forecastRunDate");
CREATE INDEX IF NOT EXISTS "CurveInstance_createdAt_idx" ON "Forecasts"."CurveInstance"("createdAt");

-- PriceForecast indexes
CREATE INDEX IF NOT EXISTS "PriceForecast_curveInstanceId_idx" ON "Forecasts"."PriceForecast"("curveInstanceId");
CREATE INDEX IF NOT EXISTS "PriceForecast_flow_date_start_idx" ON "Forecasts"."PriceForecast"("flow_date_start");
CREATE INDEX IF NOT EXISTS "PriceForecast_curveInstanceId_flow_date_start_idx" ON "Forecasts"."PriceForecast"("curveInstanceId", "flow_date_start");

-- CurveData indexes
CREATE INDEX IF NOT EXISTS "CurveData_curveInstanceId_idx" ON "Forecasts"."CurveData"("curveInstanceId");
CREATE INDEX IF NOT EXISTS "CurveData_timestamp_idx" ON "Forecasts"."CurveData"("timestamp");
CREATE INDEX IF NOT EXISTS "CurveData_curveInstanceId_timestamp_idx" ON "Forecasts"."CurveData"("curveInstanceId", "timestamp");
CREATE INDEX IF NOT EXISTS "CurveData_pValue_idx" ON "Forecasts"."CurveData"("pValue");

-- CurveSchedule indexes
CREATE INDEX IF NOT EXISTS "CurveSchedule_curveDefinitionId_idx" ON "Forecasts"."CurveSchedule"("curveDefinitionId");
CREATE INDEX IF NOT EXISTS "CurveSchedule_isActive_validFrom_validUntil_idx" ON "Forecasts"."CurveSchedule"("isActive", "validFrom", "validUntil");
CREATE INDEX IF NOT EXISTS "CurveSchedule_frequency_idx" ON "Forecasts"."CurveSchedule"("frequency");

-- ScheduleRun indexes
CREATE INDEX IF NOT EXISTS "ScheduleRun_scheduleId_idx" ON "Forecasts"."ScheduleRun"("scheduleId");
CREATE INDEX IF NOT EXISTS "ScheduleRun_runDate_idx" ON "Forecasts"."ScheduleRun"("runDate");
CREATE INDEX IF NOT EXISTS "ScheduleRun_status_idx" ON "Forecasts"."ScheduleRun"("status");

-- CurveInputLineage indexes
CREATE INDEX IF NOT EXISTS "CurveInputLineage_curveInstanceId_idx" ON "Forecasts"."CurveInputLineage"("curveInstanceId");
CREATE INDEX IF NOT EXISTS "CurveInputLineage_inputType_idx" ON "Forecasts"."CurveInputLineage"("inputType");
CREATE INDEX IF NOT EXISTS "CurveInputLineage_sourceTimestamp_idx" ON "Forecasts"."CurveInputLineage"("sourceTimestamp");

-- VersionHistory indexes
CREATE INDEX IF NOT EXISTS "VersionHistory_curveDefinitionId_idx" ON "Forecasts"."VersionHistory"("curveDefinitionId");
CREATE INDEX IF NOT EXISTS "VersionHistory_currentInstanceId_idx" ON "Forecasts"."VersionHistory"("currentInstanceId");
CREATE INDEX IF NOT EXISTS "VersionHistory_previousInstanceId_idx" ON "Forecasts"."VersionHistory"("previousInstanceId");
CREATE INDEX IF NOT EXISTS "VersionHistory_changedAt_idx" ON "Forecasts"."VersionHistory"("changedAt");

-- QualityMetric indexes
CREATE INDEX IF NOT EXISTS "QualityMetric_curveInstanceId_idx" ON "Forecasts"."QualityMetric"("curveInstanceId");
CREATE INDEX IF NOT EXISTS "QualityMetric_metricType_idx" ON "Forecasts"."QualityMetric"("metricType");
CREATE INDEX IF NOT EXISTS "QualityMetric_passed_idx" ON "Forecasts"."QualityMetric"("passed");

-- DefaultCurveInput indexes
CREATE INDEX IF NOT EXISTS "DefaultCurveInput_curveDefinitionId_idx" ON "Forecasts"."DefaultCurveInput"("curveDefinitionId");

-- CurveInstanceTemplate indexes
CREATE INDEX IF NOT EXISTS "CurveInstanceTemplate_scheduleId_idx" ON "Forecasts"."CurveInstanceTemplate"("scheduleId");

-- ========== ADD TRIGGERS FOR UPDATED_AT ==========

CREATE OR REPLACE FUNCTION "Forecasts".update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_curvedefinition_updated_at BEFORE UPDATE ON "Forecasts"."CurveDefinition"
  FOR EACH ROW EXECUTE FUNCTION "Forecasts".update_updated_at_column();

CREATE TRIGGER update_curveinstance_updated_at BEFORE UPDATE ON "Forecasts"."CurveInstance"
  FOR EACH ROW EXECUTE FUNCTION "Forecasts".update_updated_at_column();

CREATE TRIGGER update_curveschedule_updated_at BEFORE UPDATE ON "Forecasts"."CurveSchedule"
  FOR EACH ROW EXECUTE FUNCTION "Forecasts".update_updated_at_column();

CREATE TRIGGER update_defaultcurveinput_updated_at BEFORE UPDATE ON "Forecasts"."DefaultCurveInput"
  FOR EACH ROW EXECUTE FUNCTION "Forecasts".update_updated_at_column();

CREATE TRIGGER update_curveinstancetemplate_updated_at BEFORE UPDATE ON "Forecasts"."CurveInstanceTemplate"
  FOR EACH ROW EXECUTE FUNCTION "Forecasts".update_updated_at_column();

-- ========== COMMENTS FOR DOCUMENTATION ==========

COMMENT ON TABLE "Forecasts"."CurveDefinition" IS 'Core curve metadata - represents a unique curve by Market + Location + Battery specs';
COMMENT ON TABLE "Forecasts"."CurveInstance" IS 'Specific forecast runs with instance-level characteristics (type, commodity, granularity, scenario)';
COMMENT ON TABLE "Forecasts"."PriceForecast" IS 'Actual price data points with P5/P25/P50/P75/P95 values';
COMMENT ON TABLE "Forecasts"."CurveData" IS 'Alternative storage for curve data in tall format';
COMMENT ON TABLE "Forecasts"."CurveSchedule" IS 'Delivery schedules and ad-hoc requests for curves';
COMMENT ON TABLE "Forecasts"."ScheduleRun" IS 'Individual execution records for schedules';
COMMENT ON TABLE "Forecasts"."CurveInputLineage" IS 'Track data provenance and sources';
COMMENT ON TABLE "Forecasts"."VersionHistory" IS 'Track version changes and supersessions';
COMMENT ON TABLE "Forecasts"."QualityMetric" IS 'Data quality scores and validation results';
COMMENT ON TABLE "Forecasts"."DefaultCurveInput" IS 'Template inputs for creating new instances';
COMMENT ON TABLE "Forecasts"."CurveInstanceTemplate" IS 'Reusable instance configurations for schedules';

COMMENT ON COLUMN "Forecasts"."CurveDefinition"."product" IS 'DEPRECATED - Use commodity field on CurveInstance instead';
COMMENT ON COLUMN "Forecasts"."CurveInstance"."curveType" IS 'Instance-specific: e.g., "Revenue Forecast", "Price Forecast"';
COMMENT ON COLUMN "Forecasts"."CurveInstance"."commodity" IS 'Instance-specific: e.g., "Total Revenue", "EA Revenue", "AS Revenue"';
COMMENT ON COLUMN "Forecasts"."CurveInstance"."granularity" IS 'Instance-specific: MONTHLY, QUARTERLY, ANNUAL, etc.';
COMMENT ON COLUMN "Forecasts"."CurveInstance"."scenario" IS 'Instance-specific: BASE, HIGH, LOW, P50, P90, etc.';
COMMENT ON COLUMN "Forecasts"."CurveInstance"."degradationType" IS 'Instance-specific: NONE, YEAR_1, YEAR_5, YEAR_10, etc.';

