-- ============================================================================
-- MISSING TABLES ONLY - Safe to run
-- ============================================================================
-- This creates only the 6 missing tables
-- ============================================================================

-- 1. Conversation Participants (who's in each conversation)
CREATE TABLE IF NOT EXISTS ConversationParticipants (
  participant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES Conversations(conversation_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
  role VARCHAR(50), -- participant, admin, moderator
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  unread_count INTEGER DEFAULT 0,
  last_read_at TIMESTAMP WITH TIME ZONE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_conversation ON ConversationParticipants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON ConversationParticipants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_active ON ConversationParticipants(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_participants_unread ON ConversationParticipants(unread_count) WHERE unread_count > 0;

-- 2. Message Read Receipts (read tracking)
CREATE TABLE IF NOT EXISTS MessageReadReceipts (
  receipt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES Messages(message_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_receipts_message ON MessageReadReceipts(message_id);
CREATE INDEX IF NOT EXISTS idx_receipts_user ON MessageReadReceipts(user_id);

-- 3. Message Reactions (likes, emojis)
CREATE TABLE IF NOT EXISTS MessageReactions (
  reaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES Messages(message_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
  reaction_type VARCHAR(50) NOT NULL, -- like, love, thumbsup, etc
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_reactions_message ON MessageReactions(message_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON MessageReactions(user_id);

-- 4. Review Request Settings (user preferences)
CREATE TABLE IF NOT EXISTS ReviewRequestSettings (
  settings_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES Users(user_id) ON DELETE CASCADE,
  user_role VARCHAR(50) NOT NULL, -- merchant, courier, admin
  
  -- Automation settings
  auto_request_enabled BOOLEAN DEFAULT TRUE,
  days_after_delivery INTEGER DEFAULT 2,
  max_requests_per_order INTEGER DEFAULT 3,
  reminder_interval_days INTEGER DEFAULT 7,
  
  -- Channel settings
  email_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  
  -- Customization
  custom_message TEXT,
  custom_subject VARCHAR(255),
  include_incentive BOOLEAN DEFAULT FALSE,
  incentive_text VARCHAR(255),
  
  -- Targeting
  min_order_value DECIMAL(10, 2),
  only_successful_deliveries BOOLEAN DEFAULT TRUE,
  exclude_low_ratings BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_settings_user ON ReviewRequestSettings(user_id);
CREATE INDEX IF NOT EXISTS idx_review_settings_role ON ReviewRequestSettings(user_role);
CREATE INDEX IF NOT EXISTS idx_review_settings_auto ON ReviewRequestSettings(auto_request_enabled) WHERE auto_request_enabled = TRUE;

-- 5. Review Request Responses (track user actions)
CREATE TABLE IF NOT EXISTS ReviewRequestResponses (
  response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES ReviewRequests(request_id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- opened, clicked, declined, completed
  action_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_responses_request ON ReviewRequestResponses(request_id);
CREATE INDEX IF NOT EXISTS idx_review_responses_action ON ReviewRequestResponses(action);

-- 6. Payment History (transaction history)
CREATE TABLE IF NOT EXISTS PaymentHistory (
  payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL, -- succeeded, pending, failed
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_history_user ON PaymentHistory(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_stripe ON PaymentHistory(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_created ON PaymentHistory(created_at DESC);

-- ============================================================================
-- TRIGGERS (if not already created)
-- ============================================================================

-- Function to update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE Conversations
  SET last_message_at = NEW.created_at,
      updated_at = NOW()
  WHERE conversation_id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON Messages;
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON Messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Function to increment unread count for participants
CREATE OR REPLACE FUNCTION increment_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ConversationParticipants
  SET unread_count = unread_count + 1
  WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id
    AND is_active = TRUE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_unread_count ON Messages;
CREATE TRIGGER trigger_increment_unread_count
  AFTER INSERT ON Messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_unread_count();

-- Function to reset unread count when user reads messages
CREATE OR REPLACE FUNCTION reset_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ConversationParticipants
  SET unread_count = 0,
      last_read_at = NOW()
  WHERE conversation_id = (
    SELECT conversation_id FROM Messages WHERE message_id = NEW.message_id
  )
  AND user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reset_unread_count ON MessageReadReceipts;
CREATE TRIGGER trigger_reset_unread_count
  AFTER INSERT ON MessageReadReceipts
  FOR EACH ROW
  EXECUTE FUNCTION reset_unread_count();

-- ============================================================================
-- DEFAULT DATA
-- ============================================================================

-- Create default review request settings for merchants and couriers
INSERT INTO ReviewRequestSettings (user_id, user_role)
SELECT user_id, user_role FROM Users
WHERE user_role IN ('merchant', 'courier', 'admin')
  AND user_id NOT IN (SELECT user_id FROM ReviewRequestSettings)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- COMPLETION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ MISSING TABLES CREATED!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Created:';
  RAISE NOTICE '- ConversationParticipants';
  RAISE NOTICE '- MessageReadReceipts';
  RAISE NOTICE '- MessageReactions';
  RAISE NOTICE '- ReviewRequestSettings';
  RAISE NOTICE '- ReviewRequestResponses';
  RAISE NOTICE '- PaymentHistory';
  RAISE NOTICE '';
  RAISE NOTICE 'All 12 tables now complete!';
END $$;
