-- Database Migration: Add base_price to document_types
ALTER TABLE document_types ADD COLUMN IF NOT EXISTS base_price NUMERIC(10,2) DEFAULT 0;

-- Set default prices according to current hardcoded values
UPDATE document_types SET base_price = 15.00 WHERE name = 'transcript';
UPDATE document_types SET base_price = 10.00 WHERE name = 'enrollment';
UPDATE document_types SET base_price = 45.00 WHERE name = 'graduation';
UPDATE document_types SET base_price = 10.00 WHERE name = 'deans';
UPDATE document_types SET base_price = 75.00 WHERE name = 'diploma';
UPDATE document_types SET base_price = 10.00 WHERE name = 'good_moral';
