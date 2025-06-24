-- Seed data for ChefCheck HACCP application
-- Run this in your Supabase SQL Editor

-- Insert sample suppliers
INSERT INTO suppliers (name, contact_person, phone, email) VALUES
('Fresh Produce Co.', 'John Appleseed', '555-1234', 'john@freshproduce.com'),
('Meat Packers Inc.', 'Jane Doe', '555-5678', 'jane@meatpackers.com'),
('Dairy Best Ltd.', 'Peter Pan', '555-8765', 'peter@dairybest.com');

-- Insert sample appliances
INSERT INTO appliances (name, location, type, min_temp, max_temp) VALUES
('Walk-in Fridge 1', 'Main Kitchen', 'Fridge', 0, 5),
('Freezer A', 'Storage Area', 'Freezer', -25, -18),
('Oven 1', 'Bakery Section', 'Oven', 180, 220),
('Bain Marie', 'Service Counter', 'Hot Hold', 63, 75);

-- Insert sample users
INSERT INTO users (name, email, role) VALUES
('Alice Wonderland', 'alice@chefcheck.com', 'admin'),
('Bob Builder', 'bob@chefcheck.com', 'staff'),
('Carol Singer', 'carol@chefcheck.com', 'staff');

-- Insert sample cleaning tasks
INSERT INTO cleaning_tasks (name, area, frequency, description, equipment) VALUES
('Deep Clean Prep Surfaces', 'Kitchen', 'daily', 'Sanitize all food preparation surfaces', ARRAY['Sanitizer', 'Cleaning cloths', 'Scrub brush']),
('Clean Walk-in Fridge', 'Storage', 'weekly', 'Full cleaning of walk-in refrigerator', ARRAY['Fridge cleaner', 'Mop', 'Sanitizer']),
('Oven Deep Clean', 'Bakery', 'monthly', 'Complete oven cleaning and maintenance', ARRAY['Oven cleaner', 'Steel wool', 'Gloves']);

-- Insert sample production logs (using the user IDs from above)
INSERT INTO production_logs (product_name, batch_code, critical_limit_details, is_compliant, verified_by)
SELECT 
    'Chicken Breast', 
    'CB-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-001', 
    'Cooked to 75°C internal temperature', 
    true,
    u.id
FROM users u WHERE u.email = 'alice@chefcheck.com' LIMIT 1;

INSERT INTO production_logs (product_name, batch_code, critical_limit_details, is_compliant, corrective_action, verified_by)
SELECT 
    'Beef Stew', 
    'BS-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-001', 
    'Temperature reached only 70°C', 
    false,
    'Re-cooked to 75°C and re-tested',
    u.id
FROM users u WHERE u.email = 'bob@chefcheck.com' LIMIT 1;

-- Insert sample temperature logs
INSERT INTO temperature_logs (appliance_id, temperature, is_compliant, logged_by)
SELECT 
    a.id,
    3.5,
    true,
    u.id
FROM appliances a, users u 
WHERE a.name = 'Walk-in Fridge 1' AND u.email = 'alice@chefcheck.com' LIMIT 1;

INSERT INTO temperature_logs (appliance_id, temperature, is_compliant, corrective_action, logged_by)
SELECT 
    a.id,
    8.0,
    false,
    'Adjusted thermostat and monitored',
    u.id
FROM appliances a, users u 
WHERE a.name = 'Walk-in Fridge 1' AND u.email = 'bob@chefcheck.com' LIMIT 1;

-- Insert sample delivery logs
INSERT INTO delivery_logs (supplier_id, vehicle_reg, driver_name, overall_condition, is_compliant, received_by)
SELECT 
    s.id,
    'ABC-123',
    'Mike Driver',
    'good',
    true,
    u.id
FROM suppliers s, users u 
WHERE s.name = 'Fresh Produce Co.' AND u.email = 'carol@chefcheck.com' LIMIT 1;

-- Insert delivery items for the above delivery
INSERT INTO delivery_items (delivery_log_id, name, quantity, unit, temperature, is_compliant)
SELECT 
    dl.id,
    'Lettuce',
    10,
    'kg',
    4.0,
    true
FROM delivery_logs dl
WHERE dl.vehicle_reg = 'ABC-123' LIMIT 1;

INSERT INTO delivery_items (delivery_log_id, name, quantity, unit, is_compliant, notes)
SELECT 
    dl.id,
    'Tomatoes',
    5,
    'kg',
    true,
    'Fresh and good quality'
FROM delivery_logs dl
WHERE dl.vehicle_reg = 'ABC-123' LIMIT 1;

-- Insert sample cleaning checklist items
INSERT INTO cleaning_checklist_items (task_id, name, area, frequency, description, completed, completed_at, completed_by)
SELECT 
    ct.id,
    ct.name,
    ct.area,
    ct.frequency,
    ct.description,
    true,
    NOW() - INTERVAL '2 hours',
    u.id
FROM cleaning_tasks ct, users u 
WHERE ct.name = 'Deep Clean Prep Surfaces' AND u.email = 'alice@chefcheck.com' LIMIT 1;

INSERT INTO cleaning_checklist_items (task_id, name, area, frequency, description, completed)
SELECT 
    ct.id,
    ct.name,
    ct.area,
    ct.frequency,
    ct.description,
    false
FROM cleaning_tasks ct
WHERE ct.name = 'Clean Walk-in Fridge' LIMIT 1;