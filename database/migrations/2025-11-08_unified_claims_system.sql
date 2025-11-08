-- UNIFIED CLAIMS SYSTEM
-- Date: November 8, 2025
-- Purpose: Handle claims for ALL couriers (lost, damaged, delayed, etc.)

-- =====================================================
-- TABLE: claims
-- =====================================================

CREATE TABLE IF NOT EXISTS public.claims (
  -- Primary Key
  claim_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Foreign Keys
  order_id UUID NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE,
  courier_id UUID NOT NULL REFERENCES public.couriers(courier_id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(store_id) ON DELETE CASCADE,
  
  -- Claim Details
  claim_number VARCHAR(50) UNIQUE NOT NULL, -- Auto-generated: CLM-YYYYMMDD-XXXX
  claim_type VARCHAR(50) NOT NULL CHECK (claim_type IN (
    'lost',
    'damaged',
    'delayed',
    'wrong_delivery',
    'missing_items',
    'not_delivered',
    'returned_to_sender',
    'other'
  )),
  claim_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (claim_status IN (
    'pending',           -- Claim submitted
    'under_review',      -- Being reviewed
    'investigating',     -- Courier investigating
    'approved',          -- Claim approved
    'rejected',          -- Claim rejected
    'resolved',          -- Claim resolved
    'closed'             -- Claim closed
  )),
  
  -- Claim Information
  tracking_number VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  claim_amount NUMERIC(10, 2), -- Amount claimed
  approved_amount NUMERIC(10, 2), -- Amount approved
  currency VARCHAR(3) DEFAULT 'NOK',
  
  -- Evidence
  evidence_photos TEXT[], -- Array of photo URLs
  evidence_documents TEXT[], -- Array of document URLs
  evidence_description TEXT,
  
  -- Courier Response
  courier_claim_id VARCHAR(100), -- Claim ID from courier's system
  courier_response TEXT,
  courier_response_date TIMESTAMP WITH TIME ZONE,
  courier_resolution VARCHAR(50), -- approved, rejected, partial
  courier_notes TEXT,
  
  -- Resolution
  resolution_type VARCHAR(50), -- refund, replacement, compensation, none
  resolution_amount NUMERIC(10, 2),
  resolution_date TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  
  -- Communication
  last_contact_date TIMESTAMP WITH TIME ZONE,
  next_follow_up_date TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_to_courier_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- TABLE: claim_messages
-- =====================================================

CREATE TABLE IF NOT EXISTS public.claim_messages (
  message_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_id UUID NOT NULL REFERENCES public.claims(claim_id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(user_id),
  sender_type VARCHAR(20) NOT NULL, -- merchant, courier, admin, system
  message_type VARCHAR(20) NOT NULL, -- comment, status_update, courier_response
  message TEXT NOT NULL,
  attachments TEXT[], -- Array of attachment URLs
  is_internal BOOLEAN DEFAULT false, -- Internal notes not visible to merchant
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: claim_templates
-- =====================================================

CREATE TABLE IF NOT EXISTS public.claim_templates (
  template_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  courier_id UUID REFERENCES public.couriers(courier_id) ON DELETE CASCADE,
  claim_type VARCHAR(50) NOT NULL,
  template_name VARCHAR(100) NOT NULL,
  description TEXT,
  required_fields JSONB, -- Fields required by courier
  submission_url VARCHAR(500), -- Courier's claim submission URL
  api_endpoint VARCHAR(500), -- API endpoint if available
  instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(courier_id, claim_type)
);

-- =====================================================
-- TABLE: claim_statistics
-- =====================================================

CREATE TABLE IF NOT EXISTS public.claim_statistics (
  stat_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  courier_id UUID NOT NULL REFERENCES public.couriers(courier_id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Claim Counts
  total_claims INTEGER DEFAULT 0,
  claims_lost INTEGER DEFAULT 0,
  claims_damaged INTEGER DEFAULT 0,
  claims_delayed INTEGER DEFAULT 0,
  claims_other INTEGER DEFAULT 0,
  
  -- Resolution Stats
  claims_approved INTEGER DEFAULT 0,
  claims_rejected INTEGER DEFAULT 0,
  claims_pending INTEGER DEFAULT 0,
  
  -- Financial
  total_claimed_amount NUMERIC(12, 2) DEFAULT 0,
  total_approved_amount NUMERIC(12, 2) DEFAULT 0,
  
  -- Performance
  avg_resolution_time_days NUMERIC(5, 2),
  approval_rate NUMERIC(5, 2), -- Percentage
  
  -- Metadata
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(courier_id, period_start, period_end)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_claims_order_id ON public.claims(order_id);
CREATE INDEX idx_claims_courier_id ON public.claims(courier_id);
CREATE INDEX idx_claims_merchant_id ON public.claims(merchant_id);
CREATE INDEX idx_claims_store_id ON public.claims(store_id);
CREATE INDEX idx_claims_claim_number ON public.claims(claim_number);
CREATE INDEX idx_claims_claim_type ON public.claims(claim_type);
CREATE INDEX idx_claims_claim_status ON public.claims(claim_status);
CREATE INDEX idx_claims_tracking_number ON public.claims(tracking_number);
CREATE INDEX idx_claims_created_at ON public.claims(created_at);

CREATE INDEX idx_claim_messages_claim_id ON public.claim_messages(claim_id);
CREATE INDEX idx_claim_messages_sender_id ON public.claim_messages(sender_id);
CREATE INDEX idx_claim_messages_created_at ON public.claim_messages(created_at);

CREATE INDEX idx_claim_templates_courier_id ON public.claim_templates(courier_id);
CREATE INDEX idx_claim_templates_claim_type ON public.claim_templates(claim_type);

CREATE INDEX idx_claim_statistics_courier_id ON public.claim_statistics(courier_id);
CREATE INDEX idx_claim_statistics_period ON public.claim_statistics(period_start, period_end);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_statistics ENABLE ROW LEVEL SECURITY;

-- Merchants can manage their own claims
CREATE POLICY merchant_manage_claims ON public.claims
  FOR ALL
  USING (merchant_id = auth.uid())
  WITH CHECK (merchant_id = auth.uid());

-- Merchants can view/add messages to their claims
CREATE POLICY merchant_view_claim_messages ON public.claim_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.claims
      WHERE claims.claim_id = claim_messages.claim_id
        AND claims.merchant_id = auth.uid()
    )
  );

CREATE POLICY merchant_add_claim_messages ON public.claim_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.claims
      WHERE claims.claim_id = claim_messages.claim_id
        AND claims.merchant_id = auth.uid()
    )
    AND sender_id = auth.uid()
  );

-- Everyone can view claim templates
CREATE POLICY public_view_claim_templates ON public.claim_templates
  FOR SELECT
  USING (is_active = true);

-- Couriers can view their own claim statistics
CREATE POLICY courier_view_own_statistics ON public.claim_statistics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.couriers
      WHERE couriers.courier_id = claim_statistics.courier_id
        AND couriers.user_id = auth.uid()
    )
  );

-- Admin can see all
CREATE POLICY admin_all_claims ON public.claims
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE user_id = auth.uid()
        AND user_role = 'admin'
    )
  );

CREATE POLICY admin_all_claim_messages ON public.claim_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE user_id = auth.uid()
        AND user_role = 'admin'
    )
  );

CREATE POLICY admin_all_claim_templates ON public.claim_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE user_id = auth.uid()
        AND user_role = 'admin'
    )
  );

CREATE POLICY admin_all_claim_statistics ON public.claim_statistics
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE user_id = auth.uid()
        AND user_role = 'admin'
    )
  );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Generate claim number
CREATE OR REPLACE FUNCTION public.generate_claim_number()
RETURNS VARCHAR(50)
LANGUAGE plpgsql
AS $$
DECLARE
  v_date VARCHAR(8);
  v_sequence INTEGER;
  v_claim_number VARCHAR(50);
BEGIN
  v_date := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Get next sequence number for today
  SELECT COALESCE(MAX(CAST(SUBSTRING(claim_number FROM 14) AS INTEGER)), 0) + 1
  INTO v_sequence
  FROM public.claims
  WHERE claim_number LIKE 'CLM-' || v_date || '-%';
  
  v_claim_number := 'CLM-' || v_date || '-' || LPAD(v_sequence::TEXT, 4, '0');
  
  RETURN v_claim_number;
END;
$$;

-- Auto-generate claim number on insert
CREATE OR REPLACE FUNCTION public.set_claim_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.claim_number IS NULL OR NEW.claim_number = '' THEN
    NEW.claim_number := public.generate_claim_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_claim_number
  BEFORE INSERT ON public.claims
  FOR EACH ROW
  EXECUTE FUNCTION public.set_claim_number();

-- Update claim statistics
CREATE OR REPLACE FUNCTION public.update_claim_statistics(p_courier_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_period_start DATE;
  v_period_end DATE;
BEGIN
  -- Calculate for last 30 days
  v_period_start := CURRENT_DATE - INTERVAL '30 days';
  v_period_end := CURRENT_DATE;
  
  INSERT INTO public.claim_statistics (
    courier_id,
    period_start,
    period_end,
    total_claims,
    claims_lost,
    claims_damaged,
    claims_delayed,
    claims_other,
    claims_approved,
    claims_rejected,
    claims_pending,
    total_claimed_amount,
    total_approved_amount,
    avg_resolution_time_days,
    approval_rate
  )
  SELECT
    p_courier_id,
    v_period_start,
    v_period_end,
    COUNT(*),
    COUNT(*) FILTER (WHERE claim_type = 'lost'),
    COUNT(*) FILTER (WHERE claim_type = 'damaged'),
    COUNT(*) FILTER (WHERE claim_type = 'delayed'),
    COUNT(*) FILTER (WHERE claim_type NOT IN ('lost', 'damaged', 'delayed')),
    COUNT(*) FILTER (WHERE claim_status = 'approved'),
    COUNT(*) FILTER (WHERE claim_status = 'rejected'),
    COUNT(*) FILTER (WHERE claim_status = 'pending'),
    SUM(claim_amount),
    SUM(approved_amount),
    AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 86400),
    CASE 
      WHEN COUNT(*) > 0 
      THEN (COUNT(*) FILTER (WHERE claim_status = 'approved')::NUMERIC / COUNT(*) * 100)
      ELSE 0 
    END
  FROM public.claims
  WHERE courier_id = p_courier_id
    AND created_at >= v_period_start
    AND created_at <= v_period_end
  ON CONFLICT (courier_id, period_start, period_end)
  DO UPDATE SET
    total_claims = EXCLUDED.total_claims,
    claims_lost = EXCLUDED.claims_lost,
    claims_damaged = EXCLUDED.claims_damaged,
    claims_delayed = EXCLUDED.claims_delayed,
    claims_other = EXCLUDED.claims_other,
    claims_approved = EXCLUDED.claims_approved,
    claims_rejected = EXCLUDED.claims_rejected,
    claims_pending = EXCLUDED.claims_pending,
    total_claimed_amount = EXCLUDED.total_claimed_amount,
    total_approved_amount = EXCLUDED.total_approved_amount,
    avg_resolution_time_days = EXCLUDED.avg_resolution_time_days,
    approval_rate = EXCLUDED.approval_rate,
    calculated_at = NOW();
END;
$$;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.claims IS 'Unified claims system for ALL couriers (lost, damaged, delayed, etc.)';
COMMENT ON TABLE public.claim_messages IS 'Communication thread for each claim';
COMMENT ON TABLE public.claim_templates IS 'Courier-specific claim templates and requirements';
COMMENT ON TABLE public.claim_statistics IS 'Aggregate claim statistics per courier';

COMMENT ON COLUMN public.claims.claim_number IS 'Auto-generated claim number: CLM-YYYYMMDD-XXXX';
COMMENT ON COLUMN public.claims.claim_type IS 'Type of claim: lost, damaged, delayed, wrong_delivery, missing_items, not_delivered, returned_to_sender, other';
COMMENT ON COLUMN public.claims.claim_status IS 'Status: pending, under_review, investigating, approved, rejected, resolved, closed';
COMMENT ON COLUMN public.claims.courier_claim_id IS 'Claim ID from courier system (if submitted)';

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON public.claims TO authenticated;
GRANT SELECT, INSERT ON public.claim_messages TO authenticated;
GRANT SELECT ON public.claim_templates TO authenticated;
GRANT SELECT ON public.claim_statistics TO authenticated;
GRANT ALL ON public.claims TO service_role;
GRANT ALL ON public.claim_messages TO service_role;
GRANT ALL ON public.claim_templates TO service_role;
GRANT ALL ON public.claim_statistics TO service_role;
