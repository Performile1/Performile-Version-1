-- Test Users for Performile Platform
-- Password for all test accounts: "Test1234!"
-- Note: These are TEST accounts, clearly labeled as such

-- Create test users (matching actual schema)
INSERT INTO Users (email, password_hash, user_role, first_name, last_name, is_verified, is_active, created_at, updated_at) VALUES
('admin@performile.com', '$2b$12$8Hqx9K7LwqVHpPjrCK5NO7wMFRk2PIABjLL.Xh/A3cyisQyd1QrG', 'admin', 'Test', 'Admin', true, true, NOW(), NOW()),
('merchant@performile.com', '$2b$12$8Hqx9K7LwqVHpPjrCK5NO7wMFRk2PIABjLL.Xh/A3cyisQyd1QrG', 'merchant', 'Test', 'Merchant', true, true, NOW(), NOW()),
('courier@performile.com', '$2b$12$8Hqx9K7LwqVHpPjrCK5NO7wMFRk2PIABjLL.Xh/A3cyisQyd1QrG', 'courier', 'Test', 'Courier', true, true, NOW(), NOW()),
('consumer@performile.com', '$2b$12$8Hqx9K7LwqVHpPjrCK5NO7wMFRk2PIABjLL.Xh/A3cyisQyd1QrG', 'consumer', 'Test', 'Consumer', true, true, NOW(), NOW());
