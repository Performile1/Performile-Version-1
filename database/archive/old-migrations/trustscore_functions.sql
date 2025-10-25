-- TrustScore Calculation Functions
-- Advanced courier performance calculation system

-- Enhanced TrustScore calculation function
CREATE OR REPLACE FUNCTION calculate_trust_score(courier_id_param UUID)
RETURNS TABLE (
  courier_id UUID,
  courier_name VARCHAR,
  total_reviews INTEGER,
  average_rating NUMERIC,
  weighted_rating NUMERIC,
  completion_rate NUMERIC,
  on_time_rate NUMERIC,
  response_time_avg NUMERIC,
  customer_satisfaction_score NUMERIC,
  issue_resolution_rate NUMERIC,
  delivery_attempt_avg NUMERIC,
  last_mile_performance NUMERIC,
  trust_score NUMERIC,
  total_orders BIGINT,
  completed_orders BIGINT,
  on_time_deliveries BIGINT,
  calculation_time TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  WITH courier_info AS (
    SELECT c.courier_id, c.courier_name
    FROM Couriers c
    WHERE c.courier_id = courier_id_param
  ),
  order_metrics AS (
    SELECT
      COUNT(*) AS total_orders,
      COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END) AS completed_orders,
      COUNT(CASE WHEN o.order_status = 'delivered' AND o.delivery_date <= o.estimated_delivery THEN 1 END) AS on_time_deliveries,
      AVG(EXTRACT(EPOCH FROM o.first_response_time))/60 AS response_time_avg_minutes,
      COUNT(CASE WHEN o.issue_reported THEN 1 END) AS total_issues,
      COUNT(CASE WHEN o.issue_reported AND o.issue_resolved THEN 1 END) AS resolved_issues,
      AVG(o.delivery_attempts) AS delivery_attempt_avg,
      AVG(EXTRACT(EPOCH FROM o.last_mile_duration))/60 AS last_mile_minutes
    FROM Orders o
    WHERE o.courier_id = courier_id_param
  ),
  reviews_agg AS (
    SELECT
      COUNT(*)::int AS total_reviews,
      CASE WHEN COUNT(*) > 0 THEN ROUND(AVG(r.rating)::numeric, 2) ELSE 0 END AS average_rating
    FROM Reviews r
    JOIN Orders o ON r.order_id = o.order_id
    WHERE o.courier_id = courier_id_param
  ),
  review_weights AS (
    SELECT
      r.rating,
      GREATEST(0.5, LEAST(1.0, 1.0 - (EXTRACT(EPOCH FROM (NOW() - r.review_date)) / (90 * 24 * 60 * 60)))) AS weight
    FROM Reviews r
    JOIN Orders o ON r.order_id = o.order_id
    WHERE o.courier_id = courier_id_param
  ),
  weighted_rating AS (
    SELECT
      CASE
        WHEN COUNT(*) > 0 THEN ROUND((SUM(rw.rating * rw.weight) / SUM(rw.weight))::numeric, 2)
        ELSE 0
      END AS weighted_average
    FROM review_weights rw
  ),
  customer_satisfaction AS (
    SELECT
      CASE
        WHEN COUNT(r.review_id) > 0 THEN
          ROUND(
            (AVG(r.rating) * 15 +
             (COUNT(CASE WHEN r.rating >= 4 THEN 1 END)::float / NULLIF(COUNT(r.review_id), 0) * 100) * 0.5
            ) / 2, 1)
        ELSE 0
      END AS satisfaction_score
    FROM Reviews r
    JOIN Orders o ON r.order_id = o.order_id
    WHERE o.courier_id = courier_id_param
  )
  SELECT
    ci.courier_id,
    ci.courier_name,
    ra.total_reviews,
    ra.average_rating,
    wr.weighted_average,
    CASE
      WHEN om.total_orders > 0 THEN ROUND((om.completed_orders::float / om.total_orders * 100)::numeric, 1)
      ELSE 0
    END AS completion_rate,
    CASE
      WHEN om.completed_orders > 0 THEN ROUND((om.on_time_deliveries::float / om.completed_orders * 100)::numeric, 1)
      ELSE 0
    END AS on_time_rate,
    COALESCE(om.response_time_avg_minutes, 0) AS response_time_avg,
    COALESCE(cs.satisfaction_score, 0) AS customer_satisfaction_score,
    CASE
      WHEN om.total_issues > 0 THEN ROUND((om.resolved_issues::float / om.total_issues * 100)::numeric, 1)
      ELSE 0
    END AS issue_resolution_rate,
    COALESCE(om.delivery_attempt_avg, 0) AS delivery_attempt_avg,
    CASE
      WHEN om.last_mile_minutes IS NOT NULL AND om.last_mile_minutes > 0 THEN
        ROUND((100 - LEAST(100, om.last_mile_minutes / 5 * 10))::numeric, 1)
      ELSE 0
    END AS last_mile_performance,
    ROUND((
      (wr.weighted_average * 20 * 0.4) +
      (CASE WHEN om.total_orders > 0 THEN (om.completed_orders::float / om.total_orders * 100) ELSE 0 END) * 0.15 +
      (CASE WHEN om.completed_orders > 0 THEN (om.on_time_deliveries::float / om.completed_orders * 100) ELSE 0 END) * 0.15 +
      (CASE
         WHEN om.response_time_avg_minutes IS NOT NULL AND om.response_time_avg_minutes > 0
         THEN (100 - LEAST(100, om.response_time_avg_minutes / 60 * 100))
         ELSE 0
       END) * 0.10 +
      COALESCE(cs.satisfaction_score, 0) * 0.10 +
      (CASE WHEN om.total_issues > 0 THEN (om.resolved_issues::float / om.total_issues * 100) ELSE 0 END) * 0.05 +
      (CASE
         WHEN om.delivery_attempt_avg IS NOT NULL
         THEN (100 - LEAST(100, (om.delivery_attempt_avg - 1) * 50))
         ELSE 100
       END) * 0.025 +
      (CASE
         WHEN om.last_mile_minutes IS NOT NULL AND om.last_mile_minutes > 0
         THEN (100 - LEAST(100, om.last_mile_minutes / 5 * 10))
         ELSE 0
       END) * 0.025
    )::numeric, 1) AS trust_score,
    om.total_orders,
    om.completed_orders,
    om.on_time_deliveries,
    NOW()::timestamp AS calculation_time
  FROM courier_info ci
  CROSS JOIN order_metrics om
  CROSS JOIN weighted_rating wr
  CROSS JOIN customer_satisfaction cs
  CROSS JOIN reviews_agg ra;
END;
$$ LANGUAGE plpgsql;

-- Function to get courier trust scores with filtering
CREATE OR REPLACE FUNCTION get_courier_trust_scores(
  country_filter VARCHAR DEFAULT NULL,
  postal_code_filter VARCHAR DEFAULT NULL,
  min_reviews INTEGER DEFAULT 0,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  courier_id UUID,
  courier_name VARCHAR,
  trust_score NUMERIC,
  total_reviews INTEGER,
  average_rating NUMERIC,
  completion_rate NUMERIC,
  on_time_rate NUMERIC,
  total_orders BIGINT,
  last_calculated TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cts.courier_id,
    cts.courier_name,
    cts.trust_score,
    cts.total_reviews,
    cts.average_rating,
    cts.completion_rate,
    cts.on_time_rate,
    cts.total_orders,
    cts.last_calculated
  FROM CourierTrustScores cts
  WHERE 
    (country_filter IS NULL OR EXISTS (
      SELECT 1 FROM Orders o 
      WHERE o.courier_id = cts.courier_id 
      AND o.country = country_filter
    ))
    AND (postal_code_filter IS NULL OR EXISTS (
      SELECT 1 FROM Orders o 
      WHERE o.courier_id = cts.courier_id 
      AND o.postal_code LIKE postal_code_filter || '%'
    ))
    AND cts.total_reviews >= min_reviews
  ORDER BY cts.trust_score DESC, cts.total_reviews DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update trust score cache for a specific courier
CREATE OR REPLACE FUNCTION update_trust_score_cache(courier_id_param UUID)
RETURNS VOID AS $$
DECLARE
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  calc_result RECORD;
BEGIN
  start_time := NOW();
  
  -- Calculate the trust score
  SELECT * INTO calc_result
  FROM calculate_trust_score(courier_id_param)
  LIMIT 1;
  
  end_time := NOW();
  
  -- Update or insert the cache record
  INSERT INTO CourierTrustScores (
    courier_id,
    courier_name,
    total_reviews,
    average_rating,
    weighted_rating,
    completion_rate,
    on_time_rate,
    response_time_avg,
    customer_satisfaction_score,
    issue_resolution_rate,
    delivery_attempt_avg,
    last_mile_performance,
    trust_score,
    total_orders,
    completed_orders,
    on_time_deliveries,
    last_calculated,
    calculation_duration
  ) VALUES (
    calc_result.courier_id,
    calc_result.courier_name,
    calc_result.total_reviews,
    calc_result.average_rating,
    calc_result.weighted_rating,
    calc_result.completion_rate,
    calc_result.on_time_rate,
    calc_result.response_time_avg,
    calc_result.customer_satisfaction_score,
    calc_result.issue_resolution_rate,
    calc_result.delivery_attempt_avg,
    calc_result.last_mile_performance,
    calc_result.trust_score,
    calc_result.total_orders,
    calc_result.completed_orders,
    calc_result.on_time_deliveries,
    end_time,
    end_time - start_time
  )
  ON CONFLICT (courier_id) DO UPDATE SET
    courier_name = EXCLUDED.courier_name,
    total_reviews = EXCLUDED.total_reviews,
    average_rating = EXCLUDED.average_rating,
    weighted_rating = EXCLUDED.weighted_rating,
    completion_rate = EXCLUDED.completion_rate,
    on_time_rate = EXCLUDED.on_time_rate,
    response_time_avg = EXCLUDED.response_time_avg,
    customer_satisfaction_score = EXCLUDED.customer_satisfaction_score,
    issue_resolution_rate = EXCLUDED.issue_resolution_rate,
    delivery_attempt_avg = EXCLUDED.delivery_attempt_avg,
    last_mile_performance = EXCLUDED.last_mile_performance,
    trust_score = EXCLUDED.trust_score,
    total_orders = EXCLUDED.total_orders,
    completed_orders = EXCLUDED.completed_orders,
    on_time_deliveries = EXCLUDED.on_time_deliveries,
    last_calculated = EXCLUDED.last_calculated,
    calculation_duration = EXCLUDED.calculation_duration;
END;
$$ LANGUAGE plpgsql;

-- Function to update all trust score caches
CREATE OR REPLACE FUNCTION update_all_trust_score_caches()
RETURNS INTEGER AS $$
DECLARE
  courier_record RECORD;
  updated_count INTEGER := 0;
BEGIN
  FOR courier_record IN SELECT courier_id FROM Couriers WHERE is_active = TRUE
  LOOP
    PERFORM update_trust_score_cache(courier_record.courier_id);
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to automatically update trust score cache
CREATE OR REPLACE FUNCTION trigger_trust_score_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update trust score cache for the affected courier
  IF TG_TABLE_NAME = 'Orders' THEN
    PERFORM update_trust_score_cache(NEW.courier_id);
    IF OLD.courier_id IS DISTINCT FROM NEW.courier_id THEN
      PERFORM update_trust_score_cache(OLD.courier_id);
    END IF;
  ELSIF TG_TABLE_NAME = 'Reviews' THEN
    PERFORM update_trust_score_cache((SELECT courier_id FROM Orders WHERE order_id = NEW.order_id));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic trust score updates
CREATE TRIGGER trigger_orders_trust_score_update
  AFTER INSERT OR UPDATE ON Orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_trust_score_update();

CREATE TRIGGER trigger_reviews_trust_score_update
  AFTER INSERT OR UPDATE ON Reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_trust_score_update();

-- Dashboard view for comprehensive courier analytics
CREATE OR REPLACE VIEW courier_trust_score_dashboard AS
SELECT 
  c.courier_id,
  c.courier_name,
  c.description,
  c.logo_url,
  c.contact_email,
  c.service_areas,
  cts.trust_score,
  cts.total_reviews,
  cts.average_rating,
  cts.weighted_rating,
  cts.completion_rate,
  cts.on_time_rate,
  cts.response_time_avg,
  cts.customer_satisfaction_score,
  cts.issue_resolution_rate,
  cts.delivery_attempt_avg,
  cts.last_mile_performance,
  cts.total_orders,
  cts.completed_orders,
  cts.on_time_deliveries,
  cts.last_calculated,
  
  -- Performance indicators
  CASE 
    WHEN cts.trust_score >= 90 THEN 'Excellent'
    WHEN cts.trust_score >= 80 THEN 'Very Good'
    WHEN cts.trust_score >= 70 THEN 'Good'
    WHEN cts.trust_score >= 60 THEN 'Fair'
    ELSE 'Needs Improvement'
  END AS performance_grade,
  
  -- Reliability indicators
  CASE 
    WHEN cts.on_time_rate >= 95 THEN 'Highly Reliable'
    WHEN cts.on_time_rate >= 85 THEN 'Reliable'
    WHEN cts.on_time_rate >= 75 THEN 'Moderately Reliable'
    ELSE 'Unreliable'
  END AS reliability_grade,
  
  -- Recent activity (orders in last 30 days)
  (SELECT COUNT(*) FROM Orders o 
   WHERE o.courier_id = c.courier_id 
   AND o.order_date >= NOW() - INTERVAL '30 days') AS recent_orders,
   
  -- Average delivery time for completed orders
  (SELECT AVG(EXTRACT(EPOCH FROM (o.delivery_date - o.order_date))/3600)
   FROM Orders o 
   WHERE o.courier_id = c.courier_id 
   AND o.order_status = 'delivered'
   AND o.delivery_date IS NOT NULL) AS avg_delivery_hours

FROM Couriers c
LEFT JOIN CourierTrustScores cts ON c.courier_id = cts.courier_id
WHERE c.is_active = TRUE;
