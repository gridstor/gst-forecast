-- Add curveId field to curve_schedule table
ALTER TABLE "curve_schedule" ADD COLUMN "curve_id" INTEGER;

-- Add foreign key constraint
ALTER TABLE "curve_schedule" ADD CONSTRAINT "fk_curve_schedule_curve_id" 
FOREIGN KEY ("curve_id") REFERENCES "curve_definitions"("curve_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index for better performance
CREATE INDEX "idx_curve_schedule_curve_id" ON "curve_schedule"("curve_id"); 