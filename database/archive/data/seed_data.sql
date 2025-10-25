-- Seed Data for Performile Database
-- Initial data for development and testing

-- Insert default subscription plans
INSERT INTO SubscriptionPlans (plan_name, user_role, price_monthly, price_yearly, features_json, limits_json) VALUES
-- Consumer Plans
('Consumer Free', 'consumer', 0.00, 0.00, 
 '{"basic_tracking": true, "review_submission": true, "carrier_comparison": false}',
 '{"max_tracked_orders": 10}'),
('Consumer Premium', 'consumer', 9.99, 99.99, 
 '{"basic_tracking": true, "review_submission": true, "carrier_comparison": true, "priority_support": true}',
 '{"max_tracked_orders": -1}'),

-- Merchant Plans
('Merchant Basic', 'merchant', 29.99, 299.99,
 '{"basic_analytics": true, "carrier_sourcing": false, "api_access": false, "custom_branding": false}',
 '{"max_stores": 1, "max_orders_per_month": 1000, "max_integrations": 2}'),
('Merchant Standard', 'merchant', 99.99, 999.99,
 '{"basic_analytics": true, "advanced_analytics": true, "carrier_sourcing": true, "api_access": true, "custom_branding": false}',
 '{"max_stores": 5, "max_orders_per_month": 10000, "max_integrations": 10}'),
('Merchant Premium', 'merchant', 299.99, 2999.99,
 '{"basic_analytics": true, "advanced_analytics": true, "carrier_sourcing": true, "api_access": true, "custom_branding": true, "white_label": true}',
 '{"max_stores": -1, "max_orders_per_month": -1, "max_integrations": -1}'),

-- Courier Plans
('Courier Basic', 'courier', 49.99, 499.99,
 '{"performance_monitoring": true, "lead_generation": false, "advanced_analytics": false}',
 '{"max_deliveries_per_month": 5000, "analytics_retention_days": 30}'),
('Courier Standard', 'courier', 149.99, 1499.99,
 '{"performance_monitoring": true, "lead_generation": true, "advanced_analytics": true, "route_optimization": true}',
 '{"max_deliveries_per_month": 25000, "analytics_retention_days": 90}'),
('Courier Premium', 'courier', 399.99, 3999.99,
 '{"performance_monitoring": true, "lead_generation": true, "advanced_analytics": true, "route_optimization": true, "priority_support": true, "custom_reporting": true}',
 '{"max_deliveries_per_month": -1, "analytics_retention_days": 365}');

-- Insert default rating configurations
INSERT INTO RatingConfigurations (name, description, config_json) VALUES
('Default Rating', 'Standard rating configuration for general use', 
 '{
   "on_time": {"weight": 40, "question": "Was the delivery on time?", "type": "rating"},
   "condition": {"weight": 30, "question": "How was the package condition?", "type": "rating"},
   "communication": {"weight": 20, "question": "How was the communication?", "type": "rating"},
   "professionalism": {"weight": 10, "question": "How professional was the delivery person?", "type": "rating"}
 }'),
('E-commerce Focused', 'Rating configuration optimized for e-commerce deliveries',
 '{
   "on_time": {"weight": 35, "question": "Was the delivery on time?", "type": "rating"},
   "condition": {"weight": 35, "question": "How was the package condition?", "type": "rating"},
   "communication": {"weight": 15, "question": "How was the communication?", "type": "rating"},
   "convenience": {"weight": 15, "question": "How convenient was the delivery process?", "type": "rating"}
 }'),
('Food Delivery', 'Specialized rating for food delivery services',
 '{
   "speed": {"weight": 50, "question": "How fast was the delivery?", "type": "rating"},
   "temperature": {"weight": 25, "question": "Was the food at the right temperature?", "type": "rating"},
   "accuracy": {"weight": 15, "question": "Was the order accurate?", "type": "rating"},
   "presentation": {"weight": 10, "question": "How was the food presentation?", "type": "rating"}
 }');

-- Create admin user
INSERT INTO Users (email, password_hash, user_role, first_name, last_name, is_verified, is_active) VALUES
('admin@performile.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq5S36i', 'admin', 'System', 'Administrator', true, true);

-- Create sample merchant users
INSERT INTO Users (email, password_hash, user_role, first_name, last_name, is_verified, is_active) VALUES
('merchant1@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq5S36i', 'merchant', 'John', 'Smith', true, true),
('merchant2@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq5S36i', 'merchant', 'Sarah', 'Johnson', true, true);

-- Create sample courier users
INSERT INTO Users (email, password_hash, user_role, first_name, last_name, is_verified, is_active) VALUES
('courier1@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq5S36i', 'courier', 'Mike', 'Wilson', true, true),
('courier2@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq5S36i', 'courier', 'Lisa', 'Anderson', true, true),
('courier3@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq5S36i', 'courier', 'David', 'Brown', true, true);

-- Create sample consumer users
INSERT INTO Users (email, password_hash, user_role, first_name, last_name, is_verified, is_active) VALUES
('consumer1@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq5S36i', 'consumer', 'Emma', 'Davis', true, true),
('consumer2@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq5S36i', 'consumer', 'James', 'Miller', true, true),
('consumer3@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq5S36i', 'consumer', 'Olivia', 'Garcia', true, true);

-- Create sample stores
INSERT INTO Stores (store_name, owner_user_id, website_url, description) VALUES
('TechGadgets Store', (SELECT user_id FROM Users WHERE email = 'merchant1@example.com'), 'https://techgadgets.example.com', 'Premium electronics and gadgets'),
('Fashion Forward', (SELECT user_id FROM Users WHERE email = 'merchant2@example.com'), 'https://fashionforward.example.com', 'Trendy clothing and accessories');

-- Create sample couriers
INSERT INTO Couriers (courier_name, user_id, description, contact_email, service_areas) VALUES
('SwiftDelivery', (SELECT user_id FROM Users WHERE email = 'courier1@example.com'), 'Fast and reliable delivery service', 'contact@swiftdelivery.com', '["Stockholm", "Gothenburg", "Malmö"]'),
('EcoLogistics', (SELECT user_id FROM Users WHERE email = 'courier2@example.com'), 'Environmentally friendly delivery solutions', 'info@ecologistics.com', '["Stockholm", "Uppsala", "Västerås"]'),
('ProCourier', (SELECT user_id FROM Users WHERE email = 'courier3@example.com'), 'Professional courier services for businesses', 'support@procourier.com', '["Gothenburg", "Malmö", "Helsingborg"]');

-- Assign subscription plans to users
INSERT INTO UserSubscriptions (user_id, plan_id, status, start_date, end_date) VALUES
-- Merchants
((SELECT user_id FROM Users WHERE email = 'merchant1@example.com'), 
 (SELECT plan_id FROM SubscriptionPlans WHERE plan_name = 'Merchant Standard'), 
 'active', NOW(), NOW() + INTERVAL '1 year'),
((SELECT user_id FROM Users WHERE email = 'merchant2@example.com'), 
 (SELECT plan_id FROM SubscriptionPlans WHERE plan_name = 'Merchant Basic'), 
 'active', NOW(), NOW() + INTERVAL '1 year'),

-- Couriers
((SELECT user_id FROM Users WHERE email = 'courier1@example.com'), 
 (SELECT plan_id FROM SubscriptionPlans WHERE plan_name = 'Courier Standard'), 
 'active', NOW(), NOW() + INTERVAL '1 year'),
((SELECT user_id FROM Users WHERE email = 'courier2@example.com'), 
 (SELECT plan_id FROM SubscriptionPlans WHERE plan_name = 'Courier Basic'), 
 'active', NOW(), NOW() + INTERVAL '1 year'),
((SELECT user_id FROM Users WHERE email = 'courier3@example.com'), 
 (SELECT plan_id FROM SubscriptionPlans WHERE plan_name = 'Courier Premium'), 
 'active', NOW(), NOW() + INTERVAL '1 year'),

-- Consumers
((SELECT user_id FROM Users WHERE email = 'consumer1@example.com'), 
 (SELECT plan_id FROM SubscriptionPlans WHERE plan_name = 'Consumer Premium'), 
 'active', NOW(), NOW() + INTERVAL '1 year'),
((SELECT user_id FROM Users WHERE email = 'consumer2@example.com'), 
 (SELECT plan_id FROM SubscriptionPlans WHERE plan_name = 'Consumer Free'), 
 'active', NOW(), NOW() + INTERVAL '1 year'),
((SELECT user_id FROM Users WHERE email = 'consumer3@example.com'), 
 (SELECT plan_id FROM SubscriptionPlans WHERE plan_name = 'Consumer Free'), 
 'active', NOW(), NOW() + INTERVAL '1 year');

-- Create sample orders with enhanced TrustScore data
INSERT INTO Orders (
  tracking_number, store_id, courier_id, consumer_id, order_number,
  order_date, delivery_date, estimated_delivery, level_of_service, 
  type_of_delivery, postal_code, country, order_status, 
  first_response_time, issue_reported, issue_resolved, 
  delivery_attempts, last_mile_duration
) VALUES
-- SwiftDelivery orders
('SW001234567', 
 (SELECT store_id FROM Stores WHERE store_name = 'TechGadgets Store'),
 (SELECT courier_id FROM Couriers WHERE courier_name = 'SwiftDelivery'),
 (SELECT user_id FROM Users WHERE email = 'consumer1@example.com'),
 'TG-2024-001', 
 NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days',
 'Express', 'Standard', '11122', 'SWE', 'delivered',
 INTERVAL '15 minutes', false, false, 1, INTERVAL '20 minutes'),

('SW001234568',
 (SELECT store_id FROM Stores WHERE store_name = 'Fashion Forward'),
 (SELECT courier_id FROM Couriers WHERE courier_name = 'SwiftDelivery'),
 (SELECT user_id FROM Users WHERE email = 'consumer2@example.com'),
 'FF-2024-001',
 NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days',
 'Standard', 'Standard', '11123', 'SWE', 'delivered',
 INTERVAL '30 minutes', true, true, 1, INTERVAL '25 minutes'),

-- EcoLogistics orders
('ECO001234567',
 (SELECT store_id FROM Stores WHERE store_name = 'TechGadgets Store'),
 (SELECT courier_id FROM Couriers WHERE courier_name = 'EcoLogistics'),
 (SELECT user_id FROM Users WHERE email = 'consumer3@example.com'),
 'TG-2024-002',
 NOW() - INTERVAL '7 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '6 days',
 'Eco', 'Standard', '75221', 'SWE', 'delivered',
 INTERVAL '45 minutes', false, false, 2, INTERVAL '35 minutes'),

-- ProCourier orders
('PRO001234567',
 (SELECT store_id FROM Stores WHERE store_name = 'Fashion Forward'),
 (SELECT courier_id FROM Couriers WHERE courier_name = 'ProCourier'),
 (SELECT user_id FROM Users WHERE email = 'consumer1@example.com'),
 'FF-2024-002',
 NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day',
 'Premium', 'Express', '41101', 'SWE', 'delivered',
 INTERVAL '10 minutes', false, false, 1, INTERVAL '15 minutes');

-- Create sample reviews
INSERT INTO Reviews (
  order_id, reviewer_user_id, rating, on_time_delivery_score,
  package_condition_score, communication_score, delivery_person_score,
  review_text, delay_minutes, sentiment
) VALUES
((SELECT order_id FROM Orders WHERE tracking_number = 'SW001234567'),
 (SELECT user_id FROM Users WHERE email = 'consumer1@example.com'),
 4.5, 5.0, 4.0, 4.5, 4.5,
 'Great service, package arrived on time and in perfect condition!', 0, 'positive'),

((SELECT order_id FROM Orders WHERE tracking_number = 'SW001234568'),
 (SELECT user_id FROM Users WHERE email = 'consumer2@example.com'),
 3.5, 3.0, 4.0, 4.0, 3.5,
 'Delivery was a bit late but the driver was helpful in resolving the issue.', 60, 'neutral'),

((SELECT order_id FROM Orders WHERE tracking_number = 'ECO001234567'),
 (SELECT user_id FROM Users WHERE email = 'consumer3@example.com'),
 3.0, 2.5, 4.0, 3.5, 3.0,
 'Package arrived late and required multiple delivery attempts.', 1440, 'negative'),

((SELECT order_id FROM Orders WHERE tracking_number = 'PRO001234567'),
 (SELECT user_id FROM Users WHERE email = 'consumer1@example.com'),
 5.0, 5.0, 5.0, 5.0, 5.0,
 'Excellent service! Fast, professional, and package was perfect.', 0, 'positive');

-- Update orders to mark as reviewed
UPDATE Orders SET is_reviewed = true 
WHERE tracking_number IN ('SW001234567', 'SW001234568', 'ECO001234567', 'PRO001234567');

-- Create rating links for the orders
INSERT INTO RatingLinks (order_id, link_token, status, completion_time_minutes, communication_channel) VALUES
((SELECT order_id FROM Orders WHERE tracking_number = 'SW001234567'), 
 'link_' || generate_random_uuid()::text, 'completed', 15, 'email'),
((SELECT order_id FROM Orders WHERE tracking_number = 'SW001234568'), 
 'link_' || generate_random_uuid()::text, 'completed', 25, 'email'),
((SELECT order_id FROM Orders WHERE tracking_number = 'ECO001234567'), 
 'link_' || generate_random_uuid()::text, 'completed', 45, 'email'),
((SELECT order_id FROM Orders WHERE tracking_number = 'PRO001234567'), 
 'link_' || generate_random_uuid()::text, 'completed', 10, 'email');

-- Initialize trust score caches
SELECT update_all_trust_score_caches();
