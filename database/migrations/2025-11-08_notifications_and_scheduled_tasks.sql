-- NOTIFICATIONS AND SCHEDULED TASKS
-- Date: November 8, 2025
-- Purpose: Track notifications sent and schedule rating/review requests

-- =====================================================
-- TABLE: notifications_log
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notifications_log (
  notification_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL, -- email, sms, push, webhook
  recipient VARCHAR(255) NOT NULL,
  recipient_type VARCHAR(20) NOT NULL, -- merchant, consumer, courier
  event_type VARCHAR(50) NOT NULL, -- picked_up, delivered, exception, etc.
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, sent, failed
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_log_order_id ON public.notifications_log(order_id);
CREATE INDEX idx_notifications_log_type ON public.notifications_log(notification_type);
CREATE INDEX idx_notifications_log_status ON public.notifications_log(status);
CREATE INDEX idx_notifications_log_sent_at ON public.notifications_log(sent_at);

-- =====================================================
-- TABLE: scheduled_notifications
-- =====================================================

CREATE TABLE IF NOT EXISTS public.scheduled_notifications (
  scheduled_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL, -- rating_request, review_request
  recipient VARCHAR(255) NOT NULL,
  recipient_type VARCHAR(20) NOT NULL, -- consumer, merchant
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, sent, cancelled, failed
  data JSONB, -- Additional data for the notification
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scheduled_notifications_order_id ON public.scheduled_notifications(order_id);
CREATE INDEX idx_scheduled_notifications_type ON public.scheduled_notifications(notification_type);
CREATE INDEX idx_scheduled_notifications_status ON public.scheduled_notifications(status);
CREATE INDEX idx_scheduled_notifications_scheduled_for ON public.scheduled_notifications(scheduled_for);

-- =====================================================
-- TABLE: merchant_webhooks
-- =====================================================

CREATE TABLE IF NOT EXISTS public.merchant_webhooks (
  webhook_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(store_id) ON DELETE CASCADE,
  webhook_url VARCHAR(500) NOT NULL,
  webhook_secret VARCHAR(255),
  event_type VARCHAR(50) NOT NULL, -- picked_up, delivered, exception, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(merchant_id, event_type, webhook_url)
);

CREATE INDEX idx_merchant_webhooks_merchant_id ON public.merchant_webhooks(merchant_id);
CREATE INDEX idx_merchant_webhooks_store_id ON public.merchant_webhooks(store_id);
CREATE INDEX idx_merchant_webhooks_event_type ON public.merchant_webhooks(event_type);
CREATE INDEX idx_merchant_webhooks_active ON public.merchant_webhooks(is_active);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_webhooks ENABLE ROW LEVEL SECURITY;

-- Merchants can see notifications for their orders
CREATE POLICY merchant_view_notifications ON public.notifications_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.stores s ON o.store_id = s.store_id
      WHERE o.order_id = notifications_log.order_id
        AND s.owner_user_id = auth.uid()
    )
  );

-- Merchants can manage their webhooks
CREATE POLICY merchant_manage_webhooks ON public.merchant_webhooks
  FOR ALL
  USING (merchant_id = auth.uid())
  WITH CHECK (merchant_id = auth.uid());

-- Admin can see all
CREATE POLICY admin_all_notifications ON public.notifications_log
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE user_id = auth.uid()
        AND user_role = 'admin'
    )
  );

CREATE POLICY admin_all_scheduled ON public.scheduled_notifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE user_id = auth.uid()
        AND user_role = 'admin'
    )
  );

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.notifications_log IS 'Logs all notifications sent (email, SMS, push, webhook)';
COMMENT ON TABLE public.scheduled_notifications IS 'Scheduled notifications (rating requests, review requests)';
COMMENT ON TABLE public.merchant_webhooks IS 'Merchant webhook configurations for order events';

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT ON public.notifications_log TO authenticated;
GRANT SELECT ON public.scheduled_notifications TO authenticated;
GRANT ALL ON public.merchant_webhooks TO authenticated;
GRANT ALL ON public.notifications_log TO service_role;
GRANT ALL ON public.scheduled_notifications TO service_role;
GRANT ALL ON public.merchant_webhooks TO service_role;
