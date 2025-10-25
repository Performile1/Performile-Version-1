-- ============================================================================
-- MESSAGING AND REVIEW REQUEST SYSTEM
-- ============================================================================
-- Creates tables for in-app messaging between all user roles and automated review requests
-- ============================================================================

-- ============================================================================
-- 1. UNIVERSAL MESSAGING SYSTEM (All User Roles)
-- ============================================================================

-- Conversations table (between any users)
CREATE TABLE IF NOT EXISTS Conversations (
  conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject VARCHAR(255),
  conversation_type VARCHAR(50) DEFAULT 'direct', -- direct, group, support
  related_order_id UUID REFERENCES Orders(order_id) ON DELETE SET NULL,
  related_lead_id UUID REFERENCES LeadsMarketplace(lead_id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'active', -- active, archived, closed
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation participants (supports multiple users)
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

-- Messages table
CREATE TABLE IF NOT EXISTS Messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES Conversations(conversation_id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text', -- text, system, notification
  attachments JSONB, -- Store file URLs/metadata: [{url, name, type, size}]
  metadata JSONB, -- Additional data: {priority, tags, etc}
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message read receipts (who read which message)
CREATE TABLE IF NOT EXISTS MessageReadReceipts (
  receipt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES Messages(message_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Message reactions (likes, emojis, etc)
CREATE TABLE IF NOT EXISTS MessageReactions (
  reaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES Messages(message_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
  reaction_type VARCHAR(50) NOT NULL, -- like, love, thumbsup, etc
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, reaction_type)
);

-- Indexes for messaging
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON Conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_order ON Conversations(related_order_id);
CREATE INDEX IF NOT EXISTS idx_conversations_lead ON Conversations(related_lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON Conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON Conversations(status);

CREATE INDEX IF NOT EXISTS idx_participants_conversation ON ConversationParticipants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON ConversationParticipants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_active ON ConversationParticipants(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_participants_unread ON ConversationParticipants(unread_count) WHERE unread_count > 0;

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON Messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON Messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON Messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_type ON Messages(message_type);

CREATE INDEX IF NOT EXISTS idx_receipts_message ON MessageReadReceipts(message_id);
CREATE INDEX IF NOT EXISTS idx_receipts_user ON MessageReadReceipts(user_id);

CREATE INDEX IF NOT EXISTS idx_reactions_message ON MessageReactions(message_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON MessageReactions(user_id);

-- ============================================================================
-- 2. REVIEW REQUEST SYSTEM
-- ============================================================================

-- Review request settings (per user)
CREATE TABLE IF NOT EXISTS ReviewRequestSettings (
  settings_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES Users(user_id) ON DELETE CASCADE,
  user_role VARCHAR(50) NOT NULL, -- merchant, courier, admin
  
  -- Automation settings
  auto_request_enabled BOOLEAN DEFAULT TRUE,
  days_after_delivery INTEGER DEFAULT 2, -- Days to wait after delivery
  max_requests_per_order INTEGER DEFAULT 3, -- Max reminders
  reminder_interval_days INTEGER DEFAULT 7, -- Days between reminders
  
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
  min_order_value DECIMAL(10, 2), -- Only request reviews for orders above this value
  only_successful_deliveries BOOLEAN DEFAULT TRUE,
  exclude_low_ratings BOOLEAN DEFAULT FALSE, -- Don't request if previous rating < 3
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Review requests tracking
CREATE TABLE IF NOT EXISTS ReviewRequests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES Orders(order_id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE, -- Who requested
  recipient_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE, -- Who should review
  
  -- Request details
  request_type VARCHAR(50) DEFAULT 'automatic', -- automatic, manual
  channel VARCHAR(50) NOT NULL, -- email, sms, in_app
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, opened, completed, expired, declined
  
  -- Timing
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Content
  message_text TEXT,
  subject VARCHAR(255),
  
  -- Tracking
  reminder_count INTEGER DEFAULT 0,
  last_reminder_at TIMESTAMP WITH TIME ZONE,
  review_id UUID REFERENCES Reviews(review_id) ON DELETE SET NULL, -- Link to submitted review
  
  -- Metadata
  metadata JSONB, -- {delivery_date, order_value, etc}
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Review request responses (for tracking user actions)
CREATE TABLE IF NOT EXISTS ReviewRequestResponses (
  response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES ReviewRequests(request_id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- opened, clicked, declined, completed
  action_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB, -- {ip_address, user_agent, etc}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for review requests
CREATE INDEX IF NOT EXISTS idx_review_settings_user ON ReviewRequestSettings(user_id);
CREATE INDEX IF NOT EXISTS idx_review_settings_role ON ReviewRequestSettings(user_role);
CREATE INDEX IF NOT EXISTS idx_review_settings_auto ON ReviewRequestSettings(auto_request_enabled) WHERE auto_request_enabled = TRUE;

CREATE INDEX IF NOT EXISTS idx_review_requests_order ON ReviewRequests(order_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_requester ON ReviewRequests(requester_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_recipient ON ReviewRequests(recipient_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_status ON ReviewRequests(status);
CREATE INDEX IF NOT EXISTS idx_review_requests_scheduled ON ReviewRequests(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_review_requests_sent ON ReviewRequests(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_review_responses_request ON ReviewRequestResponses(request_id);
CREATE INDEX IF NOT EXISTS idx_review_responses_action ON ReviewRequestResponses(action);

-- ============================================================================
-- 3. NOTIFICATION PREFERENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS NotificationPreferences (
  preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES Users(user_id) ON DELETE CASCADE,
  
  -- Message notifications
  message_email BOOLEAN DEFAULT TRUE,
  message_sms BOOLEAN DEFAULT FALSE,
  message_push BOOLEAN DEFAULT TRUE,
  message_in_app BOOLEAN DEFAULT TRUE,
  
  -- Review notifications
  review_request_email BOOLEAN DEFAULT TRUE,
  review_request_sms BOOLEAN DEFAULT FALSE,
  review_received_email BOOLEAN DEFAULT TRUE,
  review_received_in_app BOOLEAN DEFAULT TRUE,
  
  -- Order notifications
  order_update_email BOOLEAN DEFAULT TRUE,
  order_update_sms BOOLEAN DEFAULT TRUE,
  order_update_in_app BOOLEAN DEFAULT TRUE,
  
  -- Marketing
  marketing_email BOOLEAN DEFAULT FALSE,
  newsletter BOOLEAN DEFAULT FALSE,
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON NotificationPreferences(user_id);

-- ============================================================================
-- 4. HELPER FUNCTIONS
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

-- Trigger to update conversation on new message
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

-- Trigger to increment unread count on new message
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

-- Trigger to reset unread count on read receipt
DROP TRIGGER IF EXISTS trigger_reset_unread_count ON MessageReadReceipts;
CREATE TRIGGER trigger_reset_unread_count
  AFTER INSERT ON MessageReadReceipts
  FOR EACH ROW
  EXECUTE FUNCTION reset_unread_count();

-- ============================================================================
-- 5. DEFAULT DATA
-- ============================================================================

-- Create default notification preferences for existing users
INSERT INTO NotificationPreferences (user_id)
SELECT user_id FROM Users
WHERE user_id NOT IN (SELECT user_id FROM NotificationPreferences)
ON CONFLICT (user_id) DO NOTHING;

-- Create default review request settings for merchants and couriers
INSERT INTO ReviewRequestSettings (user_id, user_role)
SELECT user_id, user_role FROM Users
WHERE user_role IN ('merchant', 'courier', 'admin')
  AND user_id NOT IN (SELECT user_id FROM ReviewRequestSettings)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'MESSAGING & REVIEW SYSTEM CREATED!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Messaging Features:';
  RAISE NOTICE '- Universal messaging between all user roles';
  RAISE NOTICE '- Group conversations support';
  RAISE NOTICE '- Read receipts and reactions';
  RAISE NOTICE '- File attachments support';
  RAISE NOTICE '- Unread message tracking';
  RAISE NOTICE '';
  RAISE NOTICE 'Review Request Features:';
  RAISE NOTICE '- Automated review requests';
  RAISE NOTICE '- Customizable timing and intervals';
  RAISE NOTICE '- Multi-channel (email, SMS, in-app)';
  RAISE NOTICE '- Custom messages and incentives';
  RAISE NOTICE '- Response tracking';
  RAISE NOTICE '';
  RAISE NOTICE 'Notification System:';
  RAISE NOTICE '- Per-user preferences';
  RAISE NOTICE '- Quiet hours support';
  RAISE NOTICE '- Channel-specific settings';
  RAISE NOTICE '';
  RAISE NOTICE '✅ System ready to use!';
END $$;
