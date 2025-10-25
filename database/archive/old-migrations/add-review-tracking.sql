-- =====================================================
-- Add Review Request Tracking to Orders
-- =====================================================
-- Tracks when review requests are sent to customers
-- =====================================================

-- Add review tracking columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS review_request_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS review_request_sent_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS review_token VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS review_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS review_submitted_at TIMESTAMP;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_review_token ON orders(review_token) WHERE review_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_review_pending ON orders(review_request_sent, review_submitted) 
  WHERE review_request_sent = TRUE AND review_submitted = FALSE;

-- Function to generate unique review token
CREATE OR REPLACE FUNCTION generate_review_token()
RETURNS VARCHAR(255) AS $$
DECLARE
  token VARCHAR(255);
  token_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random token (32 characters)
    token := encode(gen_random_bytes(24), 'base64');
    token := replace(token, '/', '_');
    token := replace(token, '+', '-');
    token := substring(token, 1, 32);
    
    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM orders WHERE review_token = token) INTO token_exists;
    
    -- Exit loop if token is unique
    EXIT WHEN NOT token_exists;
  END LOOP;
  
  RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Function to mark review request as sent
CREATE OR REPLACE FUNCTION mark_review_request_sent(p_order_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_token VARCHAR(255);
BEGIN
  -- Generate unique token
  v_token := generate_review_token();
  
  -- Update order
  UPDATE orders
  SET 
    review_request_sent = TRUE,
    review_request_sent_at = NOW(),
    review_token = v_token
  WHERE order_id = p_order_id
    AND review_request_sent = FALSE;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to mark review as submitted
CREATE OR REPLACE FUNCTION mark_review_submitted(p_review_token VARCHAR(255))
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE orders
  SET 
    review_submitted = TRUE,
    review_submitted_at = NOW()
  WHERE review_token = p_review_token
    AND review_submitted = FALSE;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Review tracking fields added successfully!' as status;
