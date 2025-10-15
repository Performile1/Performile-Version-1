-- ============================================================================
-- ADD REVIEW_TEXT COLUMN TO REVIEWS
-- ============================================================================

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS review_text TEXT;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reviews' 
  AND column_name = 'review_text';

-- Success
DO $$
BEGIN
    RAISE NOTICE '✅ Added review_text column to reviews';
END $$;
