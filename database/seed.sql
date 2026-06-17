-- Seed Data for Bishop Martin Document Request Portal (V2)

TRUNCATE TABLE document_types RESTART IDENTITY CASCADE;

INSERT INTO document_types (name, description, is_auto_generated, requires_payment) VALUES
('lateness_form', 'Lateness Form (Auto-generated slip)', TRUE, FALSE),
('absence_form', 'Absence Form (Auto-generated slip)', TRUE, FALSE),
('permission_slip', 'Permission Slip (Auto-generated)', TRUE, FALSE),
('transcript', 'Official Transcript', FALSE, TRUE),
('enrollment', 'Letter of Enrollment / Enrollment Letter', FALSE, TRUE),
('graduation', 'Graduation Certificate', FALSE, TRUE),
('deans', 'Dean''s Letter', FALSE, TRUE),
('diploma', 'Replacement Diploma', FALSE, TRUE),
('good_moral', 'Good Moral Certificate', FALSE, TRUE),
('other', 'Other / Special Request', FALSE, FALSE);

TRUNCATE TABLE school_payment_info RESTART IDENTITY CASCADE;

INSERT INTO school_payment_info (bank_name, account_name, account_number, instructions) VALUES
('Belize Bank', 'Bishop Martin High School', '123456789', 'Transfer the required payment for letters/transcripts to the school bank account and upload a clear image of your receipt.');

TRUNCATE TABLE staff RESTART IDENTITY CASCADE;

-- Default staff accounts (password for all is 'password123' -> $2b$10$QO0j8T/L2yV2w5W8cR7J3ONxQj7iUv5XJ.eU7qJtE4F63eWwF.C hash)
INSERT INTO staff (full_name, email, password_hash, role) VALUES
('Principal Viewer', 'principal@bmhs.edu.bz', '$2b$10$QO0j8T/L2yV2w5W8cR7J3ONxQj7iUv5XJ.eU7qJtE4F63eWwF.C', 'viewer'),
('Default Admin Office', 'office@bmhs.edu.bz', '$2b$10$QO0j8T/L2yV2w5W8cR7J3ONxQj7iUv5XJ.eU7qJtE4F63eWwF.C', 'admin'),
('System Super Admin', 'superadmin@bmhs.edu.bz', '$2b$10$QO0j8T/L2yV2w5W8cR7J3ONxQj7iUv5XJ.eU7qJtE4F63eWwF.C', 'super_admin');
