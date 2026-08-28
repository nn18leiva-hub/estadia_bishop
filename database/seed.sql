-- Seed Data for Bishop Martin Document Request Portal (V2)

TRUNCATE TABLE document_types RESTART IDENTITY CASCADE;

INSERT INTO document_types (name, description, is_auto_generated, requires_payment, base_price) VALUES
('lateness_form', 'Lateness Form (Auto-generated slip)', TRUE, FALSE, 0),
('absence_form', 'Absence Form (Auto-generated slip)', TRUE, FALSE, 0),
('transcript', 'Official Transcript', FALSE, TRUE, 15);

TRUNCATE TABLE school_payment_info RESTART IDENTITY CASCADE;

INSERT INTO school_payment_info (bank_name, account_name, account_number, instructions) VALUES
('Belize Bank', 'Bishop Martin High School', '123456789', 'Transfer the required payment for letters/transcripts to the school bank account and upload a clear image of your receipt.');

TRUNCATE TABLE staff RESTART IDENTITY CASCADE;

-- Default staff accounts (password for all is 'password123' -> $2b$10$QO0j8T/L2yV2w5W8cR7J3ONxQj7iUv5XJ.eU7qJtE4F63eWwF.C hash)
INSERT INTO staff (full_name, email, password_hash, role) VALUES
('Principal Viewer', 'principal@bmhs.edu.bz', '$2b$10$QO0j8T/L2yV2w5W8cR7J3ONxQj7iUv5XJ.eU7qJtE4F63eWwF.C', 'viewer'),
('Default Admin Office', 'office@bmhs.edu.bz', '$2b$10$QO0j8T/L2yV2w5W8cR7J3ONxQj7iUv5XJ.eU7qJtE4F63eWwF.C', 'admin'),
('System Super Admin', 'superadmin@bmhs.edu.bz', '$2b$10$QO0j8T/L2yV2w5W8cR7J3ONxQj7iUv5XJ.eU7qJtE4F63eWwF.C', 'super_admin');

TRUNCATE TABLE students RESTART IDENTITY CASCADE;

INSERT INTO students (student_code, full_name, dob, class_grade, homeroom_teacher, parent_email) VALUES
('STU-1001', 'Alex Johnson', '2008-04-12', 'Sr Science', 'Mr. Robert Davis', 'parent@example.com'),
('STU-1002', 'Brianna Smith', '2009-09-25', 'F2', 'Mrs. Sarah Thompson', 'smithfamily@example.com'),
('STU-1003', 'Carlos Gomez', '2007-11-03', 'Sr Business', 'Mr. Michael Martinez', 'gomez.parent@example.com'),
('STU-1004', 'Diana Martinez', '2008-01-18', 'J General', 'Ms. Emily White', 'diana.mom@example.com'),
('STU-1005', 'Ethan Brown', '2009-06-30', 'F1', 'Mr. David Lee', 'browns@example.com');

TRUNCATE TABLE notification_templates RESTART IDENTITY CASCADE;

INSERT INTO notification_templates (event_key, name, title_template, message_template) VALUES
('request_created', 'Request Submitted', 'Request Submitted: {document_name}', 'Your request for {document_name} for student {student_name} has been submitted successfully.'),
('status_updated', 'Status Updated', 'Status Update: {document_name}', 'The status of your request for {student_name} has been updated to {status}.'),
('payment_verified', 'Payment Verified', 'Payment Verified', 'Your payment proof for request #{request_id} has been verified by school administration.'),
('id_verified', 'ID Approved', 'Identity Verified', 'Your government ID verification for student {student_name} has been approved.'),
('slip_ready', 'Slip Processed', 'Slip Processed: {document_name}', 'Your absence/lateness slip for {student_name} has been signed, authorized, and filed directly into school records.');

TRUNCATE TABLE notification_settings RESTART IDENTITY CASCADE;

INSERT INTO notification_settings (setting_key, setting_value, description) VALUES
('auto_email_enabled', 'true', 'Automatically send email notifications to parents'),
('auto_whatsapp_enabled', 'true', 'Automatically send WhatsApp notifications to parents'),
('whatsapp_api_url', 'https://api.whatsapp-gateway.com/v1/messages', 'External WhatsApp Gateway endpoint URL'),
('whatsapp_api_token', '', 'External WhatsApp Gateway bearer authentication token');
