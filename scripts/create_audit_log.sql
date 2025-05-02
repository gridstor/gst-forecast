-- Create audit log table
CREATE TABLE IF NOT EXISTS Forecasts.curve_audit_log (
  log_id SERIAL PRIMARY KEY,
  curve_id INTEGER NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  action_metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) NOT NULL,
  CONSTRAINT fk_curve_audit_log_curve
    FOREIGN KEY (curve_id)
    REFERENCES Forecasts.curve_definitions(curve_id)
    ON DELETE CASCADE
);

-- Add indices for performance
CREATE INDEX IF NOT EXISTS idx_curve_audit_log_curve_id 
ON Forecasts.curve_audit_log(curve_id);

CREATE INDEX IF NOT EXISTS idx_curve_audit_log_created_at 
ON Forecasts.curve_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_curve_audit_log_action_type 
ON Forecasts.curve_audit_log(action_type);

-- Add a GiST index for the JSONB metadata for efficient querying
CREATE INDEX IF NOT EXISTS idx_curve_audit_log_metadata 
ON Forecasts.curve_audit_log USING GIN (action_metadata);

-- Add comments
COMMENT ON TABLE Forecasts.curve_audit_log IS 'Tracks all actions related to curve tracking and updates';
COMMENT ON COLUMN Forecasts.curve_audit_log.action_type IS 'Type of action (e.g., FILE_UPLOAD, MANUAL_UPDATE, SCHEDULE_CHANGE)';
COMMENT ON COLUMN Forecasts.curve_audit_log.action_metadata IS 'JSON metadata specific to the action type'; 