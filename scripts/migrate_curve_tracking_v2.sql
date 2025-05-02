-- Add tracking columns to existing curve_definitions table
ALTER TABLE Forecasts.curve_definitions
ADD COLUMN IF NOT EXISTS last_received_date DATE,
ADD COLUMN IF NOT EXISTS next_expected_date DATE,
ADD COLUMN IF NOT EXISTS freshness_start_date DATE,
ADD COLUMN IF NOT EXISTS freshness_end_date DATE,
ADD COLUMN IF NOT EXISTS is_currently_fresh BOOLEAN DEFAULT TRUE;

-- Create curve update history table
CREATE TABLE IF NOT EXISTS Forecasts.curve_update_history (
    update_id SERIAL PRIMARY KEY,
    curve_id INTEGER NOT NULL,
    update_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    update_type VARCHAR(50) NOT NULL, -- e.g., 'MANUAL', 'AUTOMATED', 'SCHEDULED'
    update_status VARCHAR(50) NOT NULL, -- e.g., 'SUCCESS', 'FAILED', 'PARTIAL'
    update_source VARCHAR(100), -- e.g., 'API', 'FILE_UPLOAD', 'MANUAL_ENTRY'
    updated_by VARCHAR(100),
    notes TEXT,
    CONSTRAINT fk_curve_update_history 
        FOREIGN KEY (curve_id) 
        REFERENCES Forecasts.curve_definitions(curve_id) 
        ON DELETE CASCADE
);

-- Create curve comments table
CREATE TABLE IF NOT EXISTS Forecasts.curve_comments (
    comment_id SERIAL PRIMARY KEY,
    curve_id INTEGER NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    CONSTRAINT fk_curve_comments
        FOREIGN KEY (curve_id) 
        REFERENCES Forecasts.curve_definitions(curve_id) 
        ON DELETE CASCADE
);

-- Create curve schedule table
CREATE TABLE IF NOT EXISTS Forecasts.curve_schedule (
    schedule_id SERIAL PRIMARY KEY,
    curve_id INTEGER NOT NULL,
    update_frequency VARCHAR(50) NOT NULL, -- e.g., 'DAILY', 'WEEKLY', 'MONTHLY'
    next_update_due DATE,
    last_successful_update DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_curve_schedule
        FOREIGN KEY (curve_id) 
        REFERENCES Forecasts.curve_definitions(curve_id) 
        ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_curve_definitions_freshness 
ON Forecasts.curve_definitions(freshness_start_date, freshness_end_date, is_currently_fresh);

CREATE INDEX IF NOT EXISTS idx_curve_update_history_date 
ON Forecasts.curve_update_history(update_date);

CREATE INDEX IF NOT EXISTS idx_curve_schedule_next_update 
ON Forecasts.curve_schedule(next_update_due);

-- Add trigger to maintain is_currently_fresh based on dates
CREATE OR REPLACE FUNCTION Forecasts.update_is_currently_fresh()
RETURNS TRIGGER AS $$
BEGIN
    NEW.is_currently_fresh := 
        (NEW.freshness_start_date IS NULL OR NEW.freshness_start_date <= CURRENT_DATE) AND
        (NEW.freshness_end_date IS NULL OR NEW.freshness_end_date >= CURRENT_DATE);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER maintain_is_currently_fresh
    BEFORE INSERT OR UPDATE OF freshness_start_date, freshness_end_date 
    ON Forecasts.curve_definitions
    FOR EACH ROW
    EXECUTE FUNCTION Forecasts.update_is_currently_fresh();

-- Initialize freshness periods based on existing price_forecasts data
UPDATE Forecasts.curve_definitions cd
SET 
    last_received_date = latest_mark.max_mark_date,
    freshness_start_date = latest_mark.max_mark_date
FROM (
    SELECT 
        curve_id,
        MAX(mark_date) as max_mark_date
    FROM Forecasts.price_forecasts
    GROUP BY curve_id
) latest_mark
WHERE cd.curve_id = latest_mark.curve_id
  AND cd.last_received_date IS NULL;

-- Add column comments
COMMENT ON COLUMN Forecasts.curve_definitions.last_received_date IS 'Date when the curve data was last received from external source';
COMMENT ON COLUMN Forecasts.curve_definitions.next_expected_date IS 'Expected date for next curve update';
COMMENT ON COLUMN Forecasts.curve_definitions.freshness_start_date IS 'Start date of curve freshness period';
COMMENT ON COLUMN Forecasts.curve_definitions.freshness_end_date IS 'End date of curve freshness period';
COMMENT ON COLUMN Forecasts.curve_definitions.is_currently_fresh IS 'Flag indicating if curve is currently considered fresh'; 