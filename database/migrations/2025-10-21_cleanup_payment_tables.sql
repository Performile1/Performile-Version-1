/**
 * CLEANUP PAYMENT TABLES
 * Drop any existing payment tables before running the main migration
 * Run this FIRST if you get type mismatch errors
 */

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS webhook_events CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;

-- Verify tables are dropped
SELECT 'Tables dropped successfully' as status;
