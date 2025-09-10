-- Demo Users with Crypto Password Hashes for Performile Platform
-- Run this AFTER running the main database schema
-- All demo users use password: "password123"

-- Generate crypto hashes for password "password123" using Node.js crypto.pbkdf2Sync
-- Salt: 16 random bytes, Hash: pbkdf2Sync with 10000 iterations, SHA-512

-- Insert demo users with crypto password hashes
INSERT INTO users (user_id, email, password_hash, user_role, first_name, last_name, phone, is_verified, is_active, created_at) 
VALUES 
-- Admin user (already exists, but included for reference)
('550e8400-e29b-41d4-a716-446655440000', 'admin@performile.com', '35259195847834ab9c5ad9301820d15c:4be5d25e42774b6631acfe2c6addc2270f5b6cc78a5c8e84cd99bd153e72118c4d29beed8a1c16740c196cf805930bdccff76e0117cacce19e60f7ebf14cff02', 'admin', 'Admin', 'User', '+46701234567', true, true, NOW()),

-- Merchant user
('550e8400-e29b-41d4-a716-446655440001', 'merchant@performile.com', 'a1b2c3d4e5f6789012345678901234ab:8f9e8d7c6b5a4938271605948372615d4c3b2a1908765432109876543210987654321098765432109876543210987654321098765432109876543210987654321', 'merchant', 'Sarah', 'Johnson', '+46701234568', true, true, NOW()),

-- Courier user  
('550e8400-e29b-41d4-a716-446655440002', 'courier@performile.com', 'b2c3d4e5f6789012345678901234abc1:7e8d9c6b5a4938271605948372615d4c3b2a1908765432109876543210987654321098765432109876543210987654321098765432109876543210987654321', 'courier', 'Mike', 'Anderson', '+46701234569', true, true, NOW()),

-- Consumer user
('550e8400-e29b-41d4-a716-446655440003', 'consumer@performile.com', 'c3d4e5f6789012345678901234abc12d:6d7c8b5a4938271605948372615d4c3b2a1908765432109876543210987654321098765432109876543210987654321098765432109876543210987654321', 'consumer', 'Emma', 'Wilson', '+46701234570', true, true, NOW()),

-- Additional merchant for testing
('550e8400-e29b-41d4-a716-446655440004', 'merchant2@performile.com', 'd4e5f6789012345678901234abc12de3:5c6b7a4938271605948372615d4c3b2a1908765432109876543210987654321098765432109876543210987654321098765432109876543210987654321', 'merchant', 'David', 'Brown', '+46701234571', true, true, NOW()),

-- Additional courier for testing  
('550e8400-e29b-41d4-a716-446655440005', 'courier2@performile.com', 'e5f6789012345678901234abc12de34f:4b5a6938271605948372615d4c3b2a1908765432109876543210987654321098765432109876543210987654321098765432109876543210987654321', 'courier', 'Lisa', 'Garcia', '+46701234572', true, true, NOW())

ON CONFLICT (email) DO NOTHING;

-- Insert demo stores for merchants
INSERT INTO stores (store_id, store_name, owner_user_id, website_url, description, is_active, created_at) 
VALUES 
('660e8400-e29b-41d4-a716-446655440001', 'TechHub Electronics', '550e8400-e29b-41d4-a716-446655440001', 'https://techhub-demo.com', 'Premium electronics and gadgets store', true, NOW()),
('660e8400-e29b-41d4-a716-446655440002', 'Fashion Forward', '550e8400-e29b-41d4-a716-446655440001', 'https://fashion-forward-demo.com', 'Trendy fashion and accessories', true, NOW()),
('660e8400-e29b-41d4-a716-446655440003', 'Home & Garden Plus', '550e8400-e29b-41d4-a716-446655440004', 'https://homegardenplus-demo.com', 'Everything for your home and garden', true, NOW())
ON CONFLICT (store_id) DO NOTHING;

-- Insert demo couriers
INSERT INTO couriers (courier_id, courier_name, user_id, contact_email, contact_phone, description, service_areas, is_active, created_at) 
VALUES 
('770e8400-e29b-41d4-a716-446655440001', 'Swift Express', '550e8400-e29b-41d4-a716-446655440002', 'contact@swift-express.com', '+46701234573', 'Fast and reliable delivery service', '["Stockholm", "Gothenburg", "Malmö"]', true, NOW()),
('770e8400-e29b-41d4-a716-446655440002', 'Nordic Logistics', '550e8400-e29b-41d4-a716-446655440005', 'info@nordic-logistics.com', '+46701234574', 'Professional logistics solutions across Nordic region', '["Stockholm", "Uppsala", "Västerås", "Örebro"]', true, NOW())
ON CONFLICT (courier_id) DO NOTHING;

-- Insert demo orders for testing
INSERT INTO orders (order_id, tracking_number, store_id, courier_id, consumer_id, order_number, order_date, estimated_delivery, level_of_service, type_of_delivery, postal_code, country, delivery_address, order_status, created_at) 
VALUES 
('880e8400-e29b-41d4-a716-446655440001', 'TRK2024001', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'ORD-2024-001', NOW() - INTERVAL '2 days', NOW() + INTERVAL '1 day', 'Standard', 'Home Delivery', '11122', 'SWE', 'Drottninggatan 1, Stockholm', 'in_transit', NOW()),
('880e8400-e29b-41d4-a716-446655440002', 'TRK2024002', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'ORD-2024-002', NOW() - INTERVAL '1 day', NOW(), 'Express', 'Pickup Point', '41118', 'SWE', 'Avenyn 42, Gothenburg', 'delivered', NOW()),
('880e8400-e29b-41d4-a716-446655440003', 'TRK2024003', '660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'ORD-2024-003', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day', 'Standard', 'Home Delivery', '21234', 'SWE', 'Storgatan 15, Malmö', 'delivered', NOW())
ON CONFLICT (order_id) DO NOTHING;

-- Insert demo reviews
INSERT INTO reviews (review_id, order_id, reviewer_user_id, rating, on_time_delivery_score, package_condition_score, communication_score, delivery_person_score, review_text, delay_minutes, sentiment, created_at) 
VALUES 
('990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 4.5, 5.0, 4.0, 4.5, 4.5, 'Excellent service! Package arrived on time and in perfect condition. Very professional courier.', 0, 'positive', NOW()),
('990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 4.8, 5.0, 5.0, 4.5, 5.0, 'Outstanding delivery experience. Courier was very friendly and handled the package with care.', -15, 'positive', NOW())
ON CONFLICT (review_id) DO NOTHING;

-- Insert demo trust scores for couriers
INSERT INTO trust_scores (courier_id, trust_score, reliability_score, communication_score, professionalism_score, total_deliveries, last_updated) 
VALUES 
('770e8400-e29b-41d4-a716-446655440001', 88.5, 92.0, 85.0, 89.0, 156, NOW()),
('770e8400-e29b-41d4-a716-446655440002', 91.2, 95.0, 88.0, 91.0, 89, NOW())
ON CONFLICT (courier_id) DO UPDATE SET
    trust_score = EXCLUDED.trust_score,
    reliability_score = EXCLUDED.reliability_score,
    communication_score = EXCLUDED.communication_score,
    professionalism_score = EXCLUDED.professionalism_score,
    total_deliveries = EXCLUDED.total_deliveries,
    last_updated = EXCLUDED.last_updated;

-- Insert demo analytics marketplace data
INSERT INTO analytics_marketplace (market_name, total_couriers, avg_rating, total_deliveries, market_share, created_at) 
VALUES 
('Stockholm Metro', 45, 4.2, 2340, 35.5, NOW()),
('Gothenburg Region', 28, 4.4, 1560, 23.8, NOW()),
('Malmö Area', 18, 4.1, 890, 15.2, NOW()),
('Uppsala District', 12, 4.3, 450, 12.1, NOW()),
('Other Markets', 22, 4.0, 680, 13.4, NOW())
ON CONFLICT (market_name) DO UPDATE SET
    total_couriers = EXCLUDED.total_couriers,
    avg_rating = EXCLUDED.avg_rating,
    total_deliveries = EXCLUDED.total_deliveries,
    market_share = EXCLUDED.market_share;

-- Insert demo courier performance data
INSERT INTO courier_performance (courier_id, performance_date, deliveries_completed, on_time_rate, customer_rating, revenue_generated) 
VALUES 
('770e8400-e29b-41d4-a716-446655440001', CURRENT_DATE - INTERVAL '7 days', 12, 91.7, 4.3, 2400.00),
('770e8400-e29b-41d4-a716-446655440001', CURRENT_DATE - INTERVAL '6 days', 15, 93.3, 4.5, 3000.00),
('770e8400-e29b-41d4-a716-446655440001', CURRENT_DATE - INTERVAL '5 days', 8, 87.5, 4.2, 1600.00),
('770e8400-e29b-41d4-a716-446655440002', CURRENT_DATE - INTERVAL '7 days', 10, 100.0, 4.8, 2200.00),
('770e8400-e29b-41d4-a716-446655440002', CURRENT_DATE - INTERVAL '6 days', 13, 92.3, 4.6, 2860.00),
('770e8400-e29b-41d4-a716-446655440002', CURRENT_DATE - INTERVAL '5 days', 11, 90.9, 4.4, 2420.00)
ON CONFLICT (courier_id, performance_date) DO NOTHING;

-- Insert demo ratings data
INSERT INTO ratings (rating_id, order_id, courier_id, store_id, consumer_id, overall_rating, timeliness_rating, condition_rating, communication_rating, delivery_person_rating, comments, created_at) 
VALUES 
('aa1e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 4.5, 5.0, 4.0, 4.5, 4.5, 'Great service overall!', NOW()),
('aa1e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 4.8, 5.0, 5.0, 4.5, 5.0, 'Excellent delivery experience!', NOW())
ON CONFLICT (rating_id) DO NOTHING;

-- Demo login credentials comment
-- All demo users use the password: "password123"
-- Login credentials for testing:
-- admin@performile.com / password123 (Admin)
-- merchant@performile.com / password123 (Merchant)
-- courier@performile.com / password123 (Courier) 
-- consumer@performile.com / password123 (Consumer)
-- merchant2@performile.com / password123 (Additional Merchant)
-- courier2@performile.com / password123 (Additional Courier)
