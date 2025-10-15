-- Migration: Add courier_documents table for file upload system
-- This table stores metadata for courier logos, licenses, insurance, and certifications

BEGIN;

-- Create courier_documents table
CREATE TABLE IF NOT EXISTS courier_documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    courier_id UUID NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('logo', 'license', 'insurance', 'certification')),
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Add foreign key constraint if couriers table exists
    CONSTRAINT fk_courier_documents_courier 
        FOREIGN KEY (courier_id) 
        REFERENCES couriers(courier_id) 
        ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_courier_documents_courier_id ON courier_documents(courier_id);
CREATE INDEX IF NOT EXISTS idx_courier_documents_type ON courier_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_courier_documents_uploaded_at ON courier_documents(uploaded_at DESC);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_courier_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_courier_documents_updated_at
    BEFORE UPDATE ON courier_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_courier_documents_updated_at();

-- Add sample data for testing (optional)
INSERT INTO courier_documents (courier_id, document_type, file_url, file_name, mime_type) 
SELECT 
    courier_id,
    'logo',
    'https://via.placeholder.com/200x100/0066cc/ffffff?text=' || REPLACE(courier_name, ' ', '+'),
    courier_name || '_logo.png',
    'image/png'
FROM couriers 
WHERE courier_id IN (
    SELECT courier_id FROM couriers LIMIT 3
)
ON CONFLICT DO NOTHING;

COMMIT;
