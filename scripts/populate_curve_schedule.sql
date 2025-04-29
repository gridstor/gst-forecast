-- Complete Curve Inventory for CurveSchedule Table

-- First, clear existing data to avoid conflicts
DELETE FROM curve_comment;
DELETE FROM curve_receipt;
DELETE FROM curve_update_history;
DELETE FROM curve_schedule;

-- ========================================================================
-- EXTERNAL CURVES (AURORA) - ERCOT MARKET
-- ========================================================================

-- ERCOT - Odessa - Annual
INSERT INTO curve_schedule (
    curve_pattern, location, source_type, provider, granularity, 
    update_frequency, update_day, responsible_team, description, importance
) VALUES 
('AURORA_ERCOT_ODESSA_ENERGY_ARB', 'ERCOT-Odessa', 'EXTERNAL', 'Aurora', 'ANNUAL', 
 'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Odessa Energy Arbitrage', 4),
('AURORA_ERCOT_ODESSA_ANC_SERVICES', 'ERCOT-Odessa', 'EXTERNAL', 'Aurora', 'ANNUAL', 
 'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Odessa Ancillary Services', 4),
('AURORA_ERCOT_ODESSA_TOTAL_REVENUE', 'ERCOT-Odessa', 'EXTERNAL', 'Aurora', 'ANNUAL', 
 'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Odessa Total Revenue', 5),
('AURORA_ERCOT_ODESSA_TB2_ENERGY', 'ERCOT-Odessa', 'EXTERNAL', 'Aurora', 'ANNUAL', 
 'QUARTERLY', 1, 'Market Analysis', 'Aurora ERCOT Odessa TB2 Energy', 3);

-- Rest of your SQL script...
[Your complete SQL script content] 