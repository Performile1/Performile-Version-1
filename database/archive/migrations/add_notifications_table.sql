-- Add Notifications table for real-time notification system
CREATE TABLE IF NOT EXISTS Notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('order_update', 'new_order', 'courier_assigned', 'rating_received', 'system')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON Notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON Notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON Notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON Notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON Notifications(type);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notifications_updated_at
    BEFORE UPDATE ON Notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- Insert sample notifications for testing (optional)
INSERT INTO Notifications (user_id, type, title, message, data) 
SELECT 
    u.user_id,
    'system',
    'Welcome to Performile!',
    'Your account has been successfully created. Start managing your deliveries today.',
    '{"welcome": true}'
FROM Users u 
WHERE u.is_active = true
ON CONFLICT DO NOTHING;
