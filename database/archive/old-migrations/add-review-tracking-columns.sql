-- =====================================================
-- Add Review Tracking Columns
-- =====================================================
-- Adds columns to track review requests and reminders
-- =====================================================

-- Add columns to delivery_requests table
ALTER TABLE delivery_requests 
ADD COLUMN IF NOT EXISTS review_link_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS review_link_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS review_link_sent_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS review_reminder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS review_reminder_sent_at TIMESTAMP;

-- Create review_reminders table for scheduled reminders
CREATE TABLE IF NOT EXISTS review_reminders (
  reminder_id SERIAL PRIMARY KEY,
  request_id INTEGER REFERENCES delivery_requests(request_id) ON DELETE CASCADE,
  scheduled_for TIMESTAMP NOT NULL,
  sent_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(request_id) -- One reminder per request
);

-- Create index for efficient cron job queries
CREATE INDEX IF NOT EXISTS idx_delivery_requests_review_tracking 
ON delivery_requests(completed_at, review_link_sent, review_reminder_sent, status);

CREATE INDEX IF NOT EXISTS idx_review_reminders_scheduled 
ON review_reminders(scheduled_for, status);

-- Add comment
COMMENT ON TABLE review_reminders IS 'Tracks scheduled review reminder emails';
COMMENT ON COLUMN delivery_requests.review_link_token IS 'Unique token for review link security';
COMMENT ON COLUMN delivery_requests.review_link_sent IS 'Whether initial review request was sent';
COMMENT ON COLUMN delivery_requests.review_reminder_sent IS 'Whether reminder email was sent';

SELECT 'Review tracking columns added successfully' as status;
