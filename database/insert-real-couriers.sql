-- =====================================================
-- Insert Real Courier Companies
-- =====================================================
-- Based on the couriers shown in your UI
-- =====================================================

INSERT INTO couriers (courier_name, contact_email, contact_phone, is_active, logo_url) VALUES
('Schenker Logistics', 'schenker@performile.com', '+46 10 448 50 00', TRUE, NULL),
('DHL Freight', 'dhl.freight@performile.com', '+46 771 345 346', TRUE, NULL),
('DHL eCommerce', 'dhl.ecommerce@performile.com', '+46 771 345 347', TRUE, NULL),
('Bring Logistics', 'bring@performile.com', '+47 23 96 20 00', TRUE, NULL),
('PostNord Service', 'postnord@performile.com', '+46 10 436 00 00', TRUE, NULL),
('Airmee Delivery', 'airmee@performile.com', '+46 8 446 83 00', TRUE, NULL),
('DHL Express', 'dhl.express@performile.com', '+46 771 345 345', TRUE, NULL),
('Earlybird Logistics', 'earlybird@performile.com', '+46 8 121 470 00', TRUE, NULL),
('Budbee Delivery', 'budbee@performile.com', '+46 10 410 00 00', TRUE, NULL),
('Instabox Service', 'instabox@performile.com', '+46 10 888 35 00', TRUE, NULL)
ON CONFLICT (contact_email) DO NOTHING;

-- Show results
SELECT 
    'Couriers inserted!' as status,
    COUNT(*) as total_couriers
FROM couriers;

SELECT courier_name, contact_email, is_active FROM couriers ORDER BY courier_name;
