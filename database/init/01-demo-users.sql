-- Demo Users for Performile Platform
-- Password for all demo accounts: "demo12345"
-- Hashed with bcrypt rounds=12

-- Create demo users (matching actual schema)
INSERT INTO Users (email, password_hash, user_role, first_name, last_name, is_verified, is_active, created_at, updated_at) VALUES
('admin@performile.com', '$2b$12$8Hqx9K7LwqVHpPjrCK5NO7wMFRk2PIABjLL.Xh/A3cyisQyd1QrG', 'admin', 'Admin', 'User', true, true, NOW(), NOW()),
('merchant@performile.com', '$2b$12$8Hqx9K7LwqVHpPjrCK5NO7wMFRk2PIABjLL.Xh/A3cyisQyd1QrG', 'merchant', 'Merchant', 'Demo', true, true, NOW(), NOW()),
('courier@performile.com', '$2b$12$8Hqx9K7LwqVHpPjrCK5NO7wMFRk2PIABjLL.Xh/A3cyisQyd1QrG', 'courier', 'Courier', 'Driver', true, true, NOW(), NOW()),
('consumer@performile.com', '$2b$12$8Hqx9K7LwqVHpPjrCK5NO7wMFRk2PIABjLL.Xh/A3cyisQyd1QrG', 'consumer', 'Consumer', 'User', true, true, NOW(), NOW());
