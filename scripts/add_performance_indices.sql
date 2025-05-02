-- Add indices for performance optimization
CREATE INDEX IF NOT EXISTS idx_curve_definitions_market_last_received 
ON Forecasts.curve_definitions(market, last_received_date DESC);

CREATE INDEX IF NOT EXISTS idx_curve_definitions_market_next_expected 
ON Forecasts.curve_definitions(market, next_expected_date ASC);

CREATE INDEX IF NOT EXISTS idx_curve_definitions_mark_type_location 
ON Forecasts.curve_definitions(mark_type, location, last_received_date DESC);

CREATE INDEX IF NOT EXISTS idx_price_forecasts_curve_dates 
ON Forecasts.price_forecasts(curve_id, mark_date DESC, flow_date_start DESC);

-- Add index for fast freshness period lookups
CREATE INDEX IF NOT EXISTS idx_curve_freshness_lookup 
ON Forecasts.curve_definitions(mark_type, location, mark_date) 
WHERE is_currently_fresh = true;

-- Add computed columns for quick access
ALTER TABLE Forecasts.curve_definitions
ADD COLUMN IF NOT EXISTS days_since_update INTEGER 
GENERATED ALWAYS AS (EXTRACT(DAY FROM (CURRENT_DATE - last_received_date))) STORED,
ADD COLUMN IF NOT EXISTS days_until_due INTEGER 
GENERATED ALWAYS AS (EXTRACT(DAY FROM (next_expected_date - CURRENT_DATE))) STORED; 