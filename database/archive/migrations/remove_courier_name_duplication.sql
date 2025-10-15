-- Migration: Remove courier_name duplication from CourierTrustScores table
-- This removes the redundant courier_name field since we can get it via JOIN with Couriers table

-- Start transaction
BEGIN;

-- First, update the TrustScore function to not use courier_name
CREATE OR REPLACE FUNCTION update_courier_trustscore_cache(p_courier_id UUID)
RETURNS VOID AS $$
DECLARE
    v_trust_score DECIMAL(5,2);
    v_start_time TIMESTAMP := clock_timestamp();
BEGIN
    -- Verify courier exists
    IF NOT EXISTS (SELECT 1 FROM Couriers WHERE courier_id = p_courier_id) THEN
        RAISE EXCEPTION 'Courier not found: %', p_courier_id;
    END IF;
    
    -- Calculate trust score
    SELECT calculate_courier_trustscore(p_courier_id) INTO v_trust_score;
    
    -- Update or insert cache record (without courier_name)
    INSERT INTO CourierTrustScores (
        courier_id,
        trust_score,
        last_calculated,
        calculation_duration
    ) VALUES (
        p_courier_id,
        v_trust_score,
        NOW(),
        clock_timestamp() - v_start_time
    )
    ON CONFLICT (courier_id) 
    DO UPDATE SET
        trust_score = EXCLUDED.trust_score,
        last_calculated = EXCLUDED.last_calculated,
        calculation_duration = EXCLUDED.calculation_duration;
END;
$$ LANGUAGE plpgsql;

-- Remove the redundant courier_name column from CourierTrustScores
ALTER TABLE CourierTrustScores 
DROP COLUMN IF EXISTS courier_name;

-- Commit the changes
COMMIT;

-- Note: After running this migration, any queries that need courier_name should use:
-- SELECT cts.*, c.courier_name 
-- FROM CourierTrustScores cts 
-- JOIN Couriers c ON cts.courier_id = c.courier_id;
