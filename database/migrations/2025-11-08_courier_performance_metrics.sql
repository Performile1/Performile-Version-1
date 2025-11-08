-- COURIER PERFORMANCE METRICS TABLE
-- Stores delivery performance data for ratings, reviews, and TrustScore calculation
-- Date: November 8, 2025
-- Purpose: Track OTD (On-Time Delivery), ETA accuracy, and delivery metrics

-- =====================================================
-- TABLE: courier_performance
-- =====================================================

CREATE TABLE IF NOT EXISTS public.courier_performance (
  -- Primary Key
  performance_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Foreign Keys
  courier_id UUID NOT NULL REFERENCES public.couriers(courier_id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE,
  
  -- Delivery Metrics
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  actual_delivery TIMESTAMP WITH TIME ZONE NOT NULL,
  delivery_time_hours NUMERIC(10, 2), -- Time between ETA and actual delivery
  
  -- On-Time Delivery (OTD)
  on_time_delivery BOOLEAN NOT NULL DEFAULT false,
  otd_status VARCHAR(20) CHECK (otd_status IN ('on_time', 'delayed', 'early', 'unknown')),
  
  -- ETA Accuracy
  eta_changed_count INTEGER DEFAULT 0, -- How many times ETA was changed
  final_eta_accuracy_hours NUMERIC(10, 2), -- Difference between final ETA and actual
  
  -- Exception Tracking
  had_exception BOOLEAN DEFAULT false,
  exception_type VARCHAR(50), -- delay, failed_delivery, damaged, lost, etc.
  exception_duration_hours NUMERIC(10, 2),
  
  -- Customer Satisfaction (from ratings)
  customer_rating NUMERIC(2, 1) CHECK (customer_rating >= 1 AND customer_rating <= 5),
  customer_review_id UUID REFERENCES public.reviews(review_id),
  
  -- Metadata
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(order_id) -- One performance record per order
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_courier_performance_courier_id 
  ON public.courier_performance(courier_id);

CREATE INDEX IF NOT EXISTS idx_courier_performance_order_id 
  ON public.courier_performance(order_id);

CREATE INDEX IF NOT EXISTS idx_courier_performance_otd_status 
  ON public.courier_performance(otd_status);

CREATE INDEX IF NOT EXISTS idx_courier_performance_actual_delivery 
  ON public.courier_performance(actual_delivery);

CREATE INDEX IF NOT EXISTS idx_courier_performance_on_time 
  ON public.courier_performance(on_time_delivery);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.courier_performance ENABLE ROW LEVEL SECURITY;

-- Merchants can see performance for their orders
CREATE POLICY merchant_view_performance ON public.courier_performance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.stores s ON o.store_id = s.store_id
      WHERE o.order_id = courier_performance.order_id
        AND s.owner_user_id = auth.uid()
    )
  );

-- Couriers can see their own performance
CREATE POLICY courier_view_own_performance ON public.courier_performance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.couriers c
      WHERE c.courier_id = courier_performance.courier_id
        AND c.user_id = auth.uid()
    )
  );

-- Admin can see all
CREATE POLICY admin_all_performance ON public.courier_performance
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE user_id = auth.uid()
        AND user_role = 'admin'
    )
  );

-- =====================================================
-- FUNCTION: update_courier_metrics
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_courier_metrics(p_courier_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_deliveries INTEGER;
  v_on_time_deliveries INTEGER;
  v_otd_rate NUMERIC(5, 2);
  v_avg_delivery_time NUMERIC(10, 2);
  v_exception_rate NUMERIC(5, 2);
  v_avg_rating NUMERIC(2, 1);
BEGIN
  -- Calculate aggregate metrics
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE on_time_delivery = true),
    AVG(delivery_time_hours),
    COUNT(*) FILTER (WHERE had_exception = true)::NUMERIC / NULLIF(COUNT(*), 0) * 100,
    AVG(customer_rating)
  INTO 
    v_total_deliveries,
    v_on_time_deliveries,
    v_avg_delivery_time,
    v_exception_rate,
    v_avg_rating
  FROM public.courier_performance
  WHERE courier_id = p_courier_id
    AND actual_delivery >= NOW() - INTERVAL '90 days'; -- Last 90 days

  -- Calculate OTD rate
  v_otd_rate := CASE 
    WHEN v_total_deliveries > 0 
    THEN (v_on_time_deliveries::NUMERIC / v_total_deliveries * 100)
    ELSE 0 
  END;

  -- Update courier aggregate metrics (for TrustScore)
  UPDATE public.couriers
  SET 
    total_deliveries = v_total_deliveries,
    on_time_delivery_rate = v_otd_rate,
    average_delivery_time_hours = v_avg_delivery_time,
    exception_rate = v_exception_rate,
    average_rating = v_avg_rating,
    metrics_updated_at = NOW()
  WHERE courier_id = p_courier_id;

  -- Recalculate TrustScore (if function exists)
  -- PERFORM calculate_trust_score(p_courier_id);
END;
$$;

-- =====================================================
-- FUNCTION: calculate_otd_status
-- =====================================================

CREATE OR REPLACE FUNCTION public.calculate_otd_status(
  p_estimated_delivery TIMESTAMP WITH TIME ZONE,
  p_actual_delivery TIMESTAMP WITH TIME ZONE
)
RETURNS VARCHAR(20)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_diff_hours NUMERIC;
BEGIN
  IF p_estimated_delivery IS NULL OR p_actual_delivery IS NULL THEN
    RETURN 'unknown';
  END IF;

  v_diff_hours := EXTRACT(EPOCH FROM (p_actual_delivery - p_estimated_delivery)) / 3600;

  IF v_diff_hours <= 0 THEN
    -- Delivered on or before ETA
    IF v_diff_hours < -24 THEN
      RETURN 'early'; -- More than 1 day early
    ELSE
      RETURN 'on_time';
    END IF;
  ELSE
    -- Delivered after ETA
    RETURN 'delayed';
  END IF;
END;
$$;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.courier_performance IS 'Stores delivery performance metrics for each order. Used for courier ratings, reviews, and TrustScore calculation.';
COMMENT ON COLUMN public.courier_performance.on_time_delivery IS 'True if delivered on or before estimated delivery time';
COMMENT ON COLUMN public.courier_performance.otd_status IS 'On-time delivery status: on_time, delayed, early, or unknown';
COMMENT ON COLUMN public.courier_performance.delivery_time_hours IS 'Hours between estimated and actual delivery (negative = early, positive = late)';
COMMENT ON COLUMN public.courier_performance.eta_changed_count IS 'Number of times ETA was updated during transit';
COMMENT ON COLUMN public.courier_performance.final_eta_accuracy_hours IS 'Accuracy of final ETA prediction';

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT ON public.courier_performance TO authenticated;
GRANT ALL ON public.courier_performance TO service_role;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Add columns to couriers table for aggregate metrics
ALTER TABLE public.couriers
ADD COLUMN IF NOT EXISTS total_deliveries INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS on_time_delivery_rate NUMERIC(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_delivery_time_hours NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS exception_rate NUMERIC(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating NUMERIC(2, 1),
ADD COLUMN IF NOT EXISTS metrics_updated_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.couriers.on_time_delivery_rate IS 'Percentage of deliveries on time (last 90 days)';
COMMENT ON COLUMN public.couriers.average_delivery_time_hours IS 'Average delivery time vs ETA (last 90 days)';
COMMENT ON COLUMN public.couriers.exception_rate IS 'Percentage of deliveries with exceptions (last 90 days)';
COMMENT ON COLUMN public.couriers.average_rating IS 'Average customer rating (last 90 days)';
