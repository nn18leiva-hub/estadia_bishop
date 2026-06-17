-- Migration: Add new columns to existing database
-- Run this if you already have a database and don't want to drop & re-create it.

-- Add profile_picture_path to parents (if not exists)
ALTER TABLE parents ADD COLUMN IF NOT EXISTS profile_picture_path TEXT;

-- Add profile_picture_path to staff (if not exists)
ALTER TABLE staff ADD COLUMN IF NOT EXISTS profile_picture_path TEXT;

-- Add new columns to document_requests (if not exists)
ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS processing_speed VARCHAR(50) DEFAULT 'standard';
ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS recipient_email VARCHAR(255);
ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS fee NUMERIC(10,2) DEFAULT 0;
ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS staff_notes TEXT;

-- Insert new document types (safe — uses INSERT ... ON CONFLICT DO NOTHING)
INSERT INTO document_types (name, description, is_auto_generated, requires_payment) VALUES
('transcript', 'Official Transcript', FALSE, TRUE),
('enrollment', 'Letter of Enrollment / Enrollment Letter', FALSE, TRUE),
('graduation', 'Graduation Certificate', FALSE, TRUE),
('deans', 'Dean''s Letter', FALSE, TRUE),
('diploma', 'Replacement Diploma', FALSE, TRUE),
('good_moral', 'Good Moral Certificate', FALSE, TRUE),
('other', 'Other / Special Request', FALSE, FALSE)
ON CONFLICT DO NOTHING;
