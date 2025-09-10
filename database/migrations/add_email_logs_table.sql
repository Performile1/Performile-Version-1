-- Migration: Add email_logs table for transactional email tracking
-- This table stores logs of all emails sent through the notification system

BEGIN;

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient VARCHAR(255) NOT NULL,
    email_type VARCHAR(100) NOT NULL CHECK (email_type IN (
        'order_confirmation', 
        'order_status_update', 
        'lead_purchase_notification', 
        'courier_welcome',
        'password_reset',
        'account_verification'
    )),
    order_id UUID,
    subject VARCHAR(500),
    status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'bounced')),
    sent_at TIMESTAMP DEFAULT NOW(),
    delivered_at TIMESTAMP,
    error_message TEXT,
    
    -- Add foreign key constraint if orders table exists
    CONSTRAINT fk_email_logs_order 
        FOREIGN KEY (order_id) 
        REFERENCES orders(order_id) 
        ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_order_id ON email_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);

-- Add sample data for testing (optional)
INSERT INTO email_logs (recipient, email_type, subject, status) VALUES
('test@example.com', 'courier_welcome', 'Welcome to Performile - Complete Your Profile', 'sent'),
('customer@example.com', 'order_confirmation', 'Order Confirmation - Performile', 'delivered'),
('courier@example.com', 'lead_purchase_notification', 'New Lead Purchase - Performile', 'sent')
ON CONFLICT DO NOTHING;

COMMIT;
