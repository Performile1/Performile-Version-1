-- Advanced TrustScore calculation functions
-- Optimized for performance with proper indexing

-- Function to calculate weighted TrustScore for a courier
CREATE OR REPLACE FUNCTION calculate_courier_trustscore(p_courier_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_total_reviews INTEGER := 0;
    v_avg_rating DECIMAL(4,2) := 0;
    v_completion_rate DECIMAL(5,2) := 0;
    v_on_time_rate DECIMAL(5,2) := 0;
    v_response_time_avg DECIMAL(8,2) := 0;
    v_customer_satisfaction DECIMAL(5,2) := 0;
    v_issue_resolution_rate DECIMAL(5,2) := 0;
    v_delivery_attempt_avg DECIMAL(4,2) := 0;
    v_last_mile_performance DECIMAL(5,2) := 0;
    v_trust_score DECIMAL(5,2) := 0;
    
    -- Weights for different metrics (total should be 1.0)
    w_rating DECIMAL(3,2) := 0.25;
    w_completion DECIMAL(3,2) := 0.20;
    w_on_time DECIMAL(3,2) := 0.20;
    w_response DECIMAL(3,2) := 0.10;
    w_satisfaction DECIMAL(3,2) := 0.10;
    w_resolution DECIMAL(3,2) := 0.05;
    w_attempts DECIMAL(3,2) := 0.05;
    w_last_mile DECIMAL(3,2) := 0.05;
BEGIN
    -- Get basic review metrics
    SELECT 
        COUNT(r.review_id),
        COALESCE(AVG(r.rating), 0),
        COALESCE(AVG(CASE 
            WHEN r.on_time_delivery_score IS NOT NULL 
            THEN r.on_time_delivery_score 
            ELSE r.rating 
        END), 0)
    INTO v_total_reviews, v_avg_rating, v_customer_satisfaction
    FROM Reviews r
    JOIN Orders o ON r.order_id = o.order_id
    WHERE o.courier_id = p_courier_id;
    
    -- Calculate completion rate
    SELECT 
        CASE 
            WHEN COUNT(*) > 0 
            THEN (COUNT(CASE WHEN order_status IN ('delivered') THEN 1 END) * 100.0 / COUNT(*))
            ELSE 0 
        END
    INTO v_completion_rate
    FROM Orders 
    WHERE courier_id = p_courier_id;
    
    -- Calculate on-time delivery rate
    SELECT 
        CASE 
            WHEN COUNT(CASE WHEN order_status = 'delivered' THEN 1 END) > 0
            THEN (COUNT(CASE 
                WHEN order_status = 'delivered' 
                AND (delivery_date IS NULL OR delivery_date <= estimated_delivery)
                THEN 1 END) * 100.0 / COUNT(CASE WHEN order_status = 'delivered' THEN 1 END))
            ELSE 0 
        END
    INTO v_on_time_rate
    FROM Orders 
    WHERE courier_id = p_courier_id;
    
    -- Calculate average response time (in hours)
    SELECT 
        COALESCE(AVG(EXTRACT(EPOCH FROM first_response_time) / 3600), 24)
    INTO v_response_time_avg
    FROM Orders 
    WHERE courier_id = p_courier_id 
    AND first_response_time IS NOT NULL;
    
    -- Calculate issue resolution rate
    SELECT 
        CASE 
            WHEN COUNT(CASE WHEN issue_reported = true THEN 1 END) > 0
            THEN (COUNT(CASE WHEN issue_reported = true AND issue_resolved = true THEN 1 END) * 100.0 / 
                  COUNT(CASE WHEN issue_reported = true THEN 1 END))
            ELSE 100 
        END
    INTO v_issue_resolution_rate
    FROM Orders 
    WHERE courier_id = p_courier_id;
    
    -- Calculate average delivery attempts
    SELECT 
        COALESCE(AVG(delivery_attempts), 1)
    INTO v_delivery_attempt_avg
    FROM Orders 
    WHERE courier_id = p_courier_id 
    AND order_status = 'delivered';
    
    -- Calculate last mile performance (inverse of duration in hours)
    SELECT 
        CASE 
            WHEN AVG(EXTRACT(EPOCH FROM last_mile_duration) / 3600) > 0
            THEN GREATEST(0, 100 - AVG(EXTRACT(EPOCH FROM last_mile_duration) / 3600) * 10)
            ELSE 80 
        END
    INTO v_last_mile_performance
    FROM Orders 
    WHERE courier_id = p_courier_id 
    AND last_mile_duration IS NOT NULL;
    
    -- Normalize metrics to 0-100 scale and calculate weighted score
    v_trust_score := 
        (v_avg_rating * 20) * w_rating +  -- Rating: 1-5 -> 0-100
        v_completion_rate * w_completion +
        v_on_time_rate * w_on_time +
        (GREATEST(0, 100 - v_response_time_avg * 2)) * w_response +  -- Response time penalty
        (v_customer_satisfaction * 20) * w_satisfaction +
        v_issue_resolution_rate * w_resolution +
        (GREATEST(0, 100 - (v_delivery_attempt_avg - 1) * 20)) * w_attempts +  -- Attempt penalty
        v_last_mile_performance * w_last_mile;
    
    -- Apply review count bonus/penalty
    IF v_total_reviews < 5 THEN
        v_trust_score := v_trust_score * 0.8;  -- 20% penalty for low review count
    ELSIF v_total_reviews >= 50 THEN
        v_trust_score := LEAST(100, v_trust_score * 1.1);  -- 10% bonus for high review count
    END IF;
    
    RETURN GREATEST(0, LEAST(100, v_trust_score));
END;
$$ LANGUAGE plpgsql;

-- Function to update courier trust score cache
CREATE OR REPLACE FUNCTION update_courier_trustscore_cache(p_courier_id UUID)
RETURNS VOID AS $$
DECLARE
    v_courier_name VARCHAR(255);
    v_trust_score DECIMAL(5,2);
    v_start_time TIMESTAMP := clock_timestamp();
BEGIN
    -- Get courier name
    SELECT courier_name INTO v_courier_name
    FROM Couriers 
    WHERE courier_id = p_courier_id;
    
    IF v_courier_name IS NULL THEN
        RAISE EXCEPTION 'Courier not found: %', p_courier_id;
    END IF;
    
    -- Calculate trust score
    SELECT calculate_courier_trustscore(p_courier_id) INTO v_trust_score;
    
    -- Update or insert cache record
    INSERT INTO CourierTrustScores (
        courier_id,
        courier_name,
        trust_score,
        last_calculated,
        calculation_duration
    ) VALUES (
        p_courier_id,
        v_courier_name,
        v_trust_score,
        NOW(),
        clock_timestamp() - v_start_time
    )
    ON CONFLICT (courier_id) 
    DO UPDATE SET
        courier_name = EXCLUDED.courier_name,
        trust_score = EXCLUDED.trust_score,
        last_calculated = EXCLUDED.last_calculated,
        calculation_duration = EXCLUDED.calculation_duration;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh all courier trust scores
CREATE OR REPLACE FUNCTION refresh_all_trustscores()
RETURNS INTEGER AS $$
DECLARE
    v_courier_record RECORD;
    v_updated_count INTEGER := 0;
BEGIN
    FOR v_courier_record IN 
        SELECT courier_id FROM Couriers WHERE is_active = true
    LOOP
        PERFORM update_courier_trustscore_cache(v_courier_record.courier_id);
        v_updated_count := v_updated_count + 1;
    END LOOP;
    
    RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update trust scores when reviews are added/updated
CREATE OR REPLACE FUNCTION trigger_trustscore_update()
RETURNS TRIGGER AS $$
DECLARE
    v_courier_id UUID;
BEGIN
    -- Get courier_id from the order
    SELECT courier_id INTO v_courier_id
    FROM Orders 
    WHERE order_id = COALESCE(NEW.order_id, OLD.order_id);
    
    -- Update trust score cache asynchronously
    PERFORM update_courier_trustscore_cache(v_courier_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS reviews_trustscore_update ON Reviews;
CREATE TRIGGER reviews_trustscore_update
    AFTER INSERT OR UPDATE OR DELETE ON Reviews
    FOR EACH ROW EXECUTE FUNCTION trigger_trustscore_update();

DROP TRIGGER IF EXISTS orders_trustscore_update ON Orders;
CREATE TRIGGER orders_trustscore_update
    AFTER UPDATE ON Orders
    FOR EACH ROW 
    WHEN (OLD.order_status IS DISTINCT FROM NEW.order_status OR
          OLD.delivery_date IS DISTINCT FROM NEW.delivery_date)
    EXECUTE FUNCTION trigger_trustscore_update();
