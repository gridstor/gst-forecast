-- =====================================================
-- RENAME PriceForecast → CurveInstanceData
-- Improve table naming clarity and consistency
-- =====================================================

BEGIN;

-- ========== STEP 1: BACKUP EXISTING DATA ==========
CREATE TABLE IF NOT EXISTS "Forecasts"."PriceForecast_Backup" AS 
SELECT * FROM "Forecasts"."PriceForecast";

-- ========== STEP 2: CREATE NEW TABLE WITH BETTER NAME ==========
CREATE TABLE "Forecasts"."CurveInstanceData" (
    "id" SERIAL PRIMARY KEY,
    "curveInstanceId" INT NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION,
    "valueHigh" DOUBLE PRECISION,
    "valueLow" DOUBLE PRECISION,
    "valueP90" DOUBLE PRECISION,
    "valueP10" DOUBLE PRECISION,
    "flags" TEXT[],
    
    -- Relations
    CONSTRAINT fk_instance_data_curve_instance 
        FOREIGN KEY ("curveInstanceId") REFERENCES "Forecasts"."CurveInstance"("id") ON DELETE CASCADE
);

-- ========== STEP 3: MIGRATE DATA ==========
INSERT INTO "Forecasts"."CurveInstanceData" (
    "curveInstanceId",
    "timestamp", 
    "value",
    "confidence",
    "valueHigh",
    "valueLow",
    "valueP90",
    "valueP10",
    "flags"
)
SELECT 
    "curveInstanceId",
    "timestamp",
    "value", 
    "confidence",
    "valueHigh",
    "valueLow",
    "valueP90",
    "valueP10",
    "flags"
FROM "Forecasts"."PriceForecast";

-- ========== STEP 4: CREATE OPTIMIZED INDEXES ==========
-- Primary query patterns for time series data
CREATE UNIQUE INDEX idx_instance_data_unique 
    ON "Forecasts"."CurveInstanceData"("curveInstanceId", "timestamp");

-- For instance-specific queries
CREATE INDEX idx_instance_data_curve_instance 
    ON "Forecasts"."CurveInstanceData"("curveInstanceId");

-- For time-based queries across instances  
CREATE INDEX idx_instance_data_timestamp 
    ON "Forecasts"."CurveInstanceData"("timestamp");

-- For time range queries (common pattern)
CREATE INDEX idx_instance_data_time_range 
    ON "Forecasts"."CurveInstanceData"("curveInstanceId", "timestamp") 
    INCLUDE ("value", "confidence");

-- For aggregation queries
CREATE INDEX idx_instance_data_value_analysis 
    ON "Forecasts"."CurveInstanceData"("curveInstanceId", "value", "timestamp");

-- ========== STEP 5: CREATE UTILITY VIEWS ==========

-- View for common time series queries
CREATE VIEW "Forecasts".curve_instance_timeseries AS
SELECT 
    ci."id" as instance_id,
    ci."curveDefinitionId",
    ci."instanceVersion",
    ci."deliveryPeriodStart",
    ci."deliveryPeriodEnd",
    ci."status",
    cid."timestamp",
    cid."value",
    cid."confidence",
    cid."valueHigh", 
    cid."valueLow",
    cid."flags"
FROM "Forecasts"."CurveInstance" ci
JOIN "Forecasts"."CurveInstanceData" cid ON ci."id" = cid."curveInstanceId"
WHERE ci."status" IN ('ACTIVE', 'APPROVED');

-- View for delivery fulfillment queries
CREATE VIEW "Forecasts".delivery_instance_data AS
SELECT 
    dr."id" as delivery_request_id,
    dr."dueDate",
    dr."requestedBy", 
    dr."deliveryStatus",
    ci."id" as instance_id,
    ci."instanceVersion",
    ci."createdAt" as delivered_at,
    COUNT(cid."id") as data_point_count,
    MIN(cid."timestamp") as data_start,
    MAX(cid."timestamp") as data_end,
    AVG(cid."value") as avg_value
FROM "Forecasts"."CurveDeliveryRequest" dr
JOIN "Forecasts"."CurveInstance" ci ON dr."deliveredInstanceId" = ci."id"
LEFT JOIN "Forecasts"."CurveInstanceData" cid ON ci."id" = cid."curveInstanceId"
WHERE dr."deliveryStatus" = 'DELIVERED'
GROUP BY dr."id", dr."dueDate", dr."requestedBy", dr."deliveryStatus", 
         ci."id", ci."instanceVersion", ci."createdAt";

-- ========== STEP 6: UPDATE COMMENTS ==========
COMMENT ON TABLE "Forecasts"."CurveInstanceData" IS 
'Time series data points for curve instances. Each row represents a single timestamp-value pair for a specific curve forecast run.';

COMMENT ON COLUMN "Forecasts"."CurveInstanceData"."curveInstanceId" IS 
'References the CurveInstance this data belongs to';

COMMENT ON COLUMN "Forecasts"."CurveInstanceData"."timestamp" IS 
'The time point this value represents (in curve timezone)';

COMMENT ON COLUMN "Forecasts"."CurveInstanceData"."value" IS 
'The forecasted value for this timestamp';

COMMENT ON COLUMN "Forecasts"."CurveInstanceData"."confidence" IS 
'Confidence level or standard deviation for this forecast point';

-- ========== STEP 7: DROP OLD TABLE (COMMENTED FOR SAFETY) ==========
-- Uncomment these lines only after verifying the migration worked correctly:

-- DROP TABLE "Forecasts"."PriceForecast";
-- DROP TABLE "Forecasts"."PriceForecast_Backup";

-- ========== STEP 8: PERFORMANCE VALIDATION ==========
-- Add statistics for query optimizer
ANALYZE "Forecasts"."CurveInstanceData";

-- Migration completed successfully!
-- NEXT STEPS:
-- 1. Update Prisma schema to reflect new table name
-- 2. Update API endpoints that reference PriceForecast
-- 3. Test common query patterns for performance
-- 4. Validate delivery fulfillment workflow
-- 5. After verification, uncomment DROP statements above

COMMIT; 