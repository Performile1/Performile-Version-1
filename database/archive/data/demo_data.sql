-- Demo Data for Performile Platform
-- Run this AFTER running supabase_update_safe.sql

-- Insert demo users (only if they don't exist)
INSERT INTO users (user_id, email, password_hash, user_role, first_name, last_name, phone, is_verified, is_active) 
SELECT '550e8400-e29b-41d4-a716-446655440001', 'admin@performile.com', '$2b$10$rQZ8kK9yF5xJ2L3mN4oP6eHvGtWqR7sT8uV9wX0yZ1aB2cD3eF4gH', 'admin', 'Admin', 'User', '+46701234567', true, true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@performile.com');

INSERT INTO users (user_id, email, password_hash, user_role, first_name, last_name, phone, is_verified, is_active) 
SELECT '550e8400-e29b-41d4-a716-446655440002', 'merchant@test.com', '$2b$10$rQZ8kK9yF5xJ2L3mN4oP6eHvGtWqR7sT8uV9wX0yZ1aB2cD3eF4gH', 'merchant', 'John', 'Merchant', '+46701234568', true, true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'merchant@test.com');

INSERT INTO users (user_id, email, password_hash, user_role, first_name, last_name, phone, is_verified, is_active) 
SELECT '550e8400-e29b-41d4-a716-446655440003', 'courier@test.com', '$2b$10$rQZ8kK9yF5xJ2L3mN4oP6eHvGtWqR7sT8uV9wX0yZ1aB2cD3eF4gH', 'courier', 'Jane', 'Courier', '+46701234569', true, true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'courier@test.com');

INSERT INTO users (user_id, email, password_hash, user_role, first_name, last_name, phone, is_verified, is_active) 
SELECT '550e8400-e29b-41d4-a716-446655440004', 'consumer@test.com', '$2b$10$rQZ8kK9yF5xJ2L3mN4oP6eHvGtWqR7sT8uV9wX0yZ1aB2cD3eF4gH', 'consumer', 'Bob', 'Consumer', '+46701234570', true, true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'consumer@test.com');

-- Get subscription plan IDs (assuming they exist from the safe script)
-- Insert demo stores (only if they don't exist)
INSERT INTO stores (store_id, store_name, owner_user_id, website_url, description, is_active) 
SELECT '660e8400-e29b-41d4-a716-446655440001', 'Demo Electronics Store', '550e8400-e29b-41d4-a716-446655440002', 'https://demo-electronics.com', 'A demo electronics store for testing', true
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE store_id = '660e8400-e29b-41d4-a716-446655440001');

INSERT INTO stores (store_id, store_name, owner_user_id, website_url, description, is_active) 
SELECT '660e8400-e29b-41d4-a716-446655440002', 'Fashion Boutique Demo', '550e8400-e29b-41d4-a716-446655440002', 'https://fashion-demo.com', 'A demo fashion store for testing', true
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE store_id = '660e8400-e29b-41d4-a716-446655440002');

-- Insert demo couriers (only if they don't exist)
INSERT INTO couriers (courier_id, courier_name, user_id, contact_email, contact_phone, description, service_areas, is_active) 
SELECT '770e8400-e29b-41d4-a716-446655440001', 'Swift Delivery Co', '550e8400-e29b-41d4-a716-446655440003', 'contact@swift-delivery.com', '+46701234571', 'Fast and reliable delivery service', '["Stockholm", "Gothenburg", "Malmö"]', true
WHERE NOT EXISTS (SELECT 1 FROM couriers WHERE courier_id = '770e8400-e29b-41d4-a716-446655440001');

INSERT INTO couriers (courier_id, courier_name, user_id, contact_email, contact_phone, description, service_areas, is_active) 
SELECT '770e8400-e29b-41d4-a716-446655440002', 'Express Logistics', '550e8400-e29b-41d4-a716-446655440004', 'info@express-logistics.com', '+46701234572', 'Express delivery solutions', '["Stockholm", "Uppsala", "Västerås"]', true
WHERE NOT EXISTS (SELECT 1 FROM couriers WHERE courier_id = '770e8400-e29b-41d4-a716-446655440002');

-- Link users to subscription plans (if subscription plans exist)
INSERT INTO UserSubscriptions (user_id, plan_id, status, start_date, end_date, auto_renew)
SELECT 
    '550e8400-e29b-41d4-a716-446655440002' as user_id,
    sp.plan_id,
    'active' as status,
    NOW() as start_date,
    NOW() + INTERVAL '1 year' as end_date,
    true as auto_renew
FROM subscriptionplans sp 
WHERE sp.plan_name = 'Basic Merchant' 
LIMIT 1;

INSERT INTO UserSubscriptions (user_id, plan_id, status, start_date, end_date, auto_renew)
SELECT 
    '550e8400-e29b-41d4-a716-446655440003' as user_id,
    sp.plan_id,
    'active' as status,
    NOW() as start_date,
    NOW() + INTERVAL '1 year' as end_date,
    true as auto_renew
FROM subscriptionplans sp 
WHERE sp.plan_name = 'Basic Courier' 
LIMIT 1;

-- Insert demo orders for testing
INSERT INTO Orders (order_id, tracking_number, store_id, courier_id, consumer_id, order_number, order_date, estimated_delivery, level_of_service, type_of_delivery, postal_code, country, delivery_address, order_status) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'TRK001234567', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'ORD-2024-001', NOW() - INTERVAL '2 days', NOW() + INTERVAL '1 day', 'Standard', 'Home Delivery', '11122', 'SWE', 'Drottninggatan 1, Stockholm', 'in_transit'),
('880e8400-e29b-41d4-a716-446655440002', 'TRK001234568', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', 'ORD-2024-002', NOW() - INTERVAL '1 day', NOW(), 'Express', 'Pickup Point', '41118', 'SWE', 'Avenyn 42, Gothenburg', 'delivered');

-- Insert demo reviews
INSERT INTO Reviews (review_id, order_id, reviewer_user_id, rating, on_time_delivery_score, package_condition_score, communication_score, delivery_person_score, review_text, delay_minutes, sentiment) VALUES
('990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', 4.5, 5.0, 4.0, 4.5, 4.5, 'Great service, package arrived on time and in perfect condition!', 0, 'positive');

-- Update orders to mark as reviewed
UPDATE Orders SET is_reviewed = true WHERE order_id = '880e8400-e29b-41d4-a716-446655440002';

-- Insert demo courier trust scores
INSERT INTO CourierTrustScores (courier_id, courier_name, total_reviews, average_rating, weighted_rating, completion_rate, on_time_rate, customer_satisfaction_score, trust_score, total_orders, completed_orders, on_time_deliveries) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'Swift Delivery Co', 1, 4.5, 4.5, 95.0, 92.0, 4.5, 88.5, 50, 48, 46),
('770e8400-e29b-41d4-a716-446655440002', 'Express Logistics', 1, 4.5, 4.5, 98.0, 95.0, 4.5, 92.0, 30, 29, 28);

-- Create some demo rating configurations
INSERT INTO RatingConfigurations (config_id, name, description, config_json, is_active) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', 'Standard Rating', 'Standard 5-star rating system', '{"scale": 5, "categories": ["overall", "timeliness", "condition", "communication"]}', true),
('aa0e8400-e29b-41d4-a716-446655440002', 'Detailed Rating', 'Detailed rating with multiple categories', '{"scale": 5, "categories": ["overall", "timeliness", "condition", "communication", "delivery_person", "packaging"]}', true);

-- Link users to rating configurations
INSERT INTO UserConfigurations (user_id, config_id) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'aa0e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440003', 'aa0e8400-e29b-41d4-a716-446655440002');

-- Demo comment
-- Password for all demo users is: "password123"
-- You can use these credentials to test login:
-- admin@performile.com / password123
-- merchant@test.com / password123  
-- courier@test.com / password123
-- consumer@test.com / password123
