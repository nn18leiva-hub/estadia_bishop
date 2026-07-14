-- Schema for Bishop Martin Document Request Portal (V2)

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS school_payment_info CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS document_requests CASCADE;
DROP TABLE IF EXISTS document_types CASCADE;
DROP TABLE IF EXISTS parents CASCADE;

CREATE TABLE parents (
    parent_id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    profile_picture_path TEXT,
    verified BOOLEAN DEFAULT FALSE,
    user_type VARCHAR(50) DEFAULT 'parent' CHECK (user_type IN ('parent', 'past_student')),
    dob DATE,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE document_types (
    document_type_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_auto_generated BOOLEAN DEFAULT FALSE,
    requires_payment BOOLEAN DEFAULT TRUE
);

CREATE TABLE document_requests (
    request_id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES parents(parent_id) ON DELETE CASCADE,
    id_image_path TEXT,
    id_verified BOOLEAN DEFAULT FALSE,
    student_full_name VARCHAR(255) NOT NULL,
    student_graduation_year_or_years_attended VARCHAR(100),
    document_type_id INTEGER REFERENCES document_types(document_type_id),
    form_data JSONB,
    generated_file_path TEXT,
    delivery_method VARCHAR(50) CHECK (delivery_method IN ('pickup', 'mailed', 'emailed')),
    processing_speed VARCHAR(50) DEFAULT 'standard',
    recipient_email VARCHAR(255),
    fee NUMERIC(10,2) DEFAULT 0,
    staff_notes TEXT,
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT
);

CREATE TABLE staff (
    staff_id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile_picture_path TEXT,
    role VARCHAR(50) CHECK (role IN ('viewer', 'admin', 'super_admin')),
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES document_requests(request_id) ON DELETE CASCADE,
    receipt_image_path TEXT NOT NULL,
    transfer_reference VARCHAR(100),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE,
    verified_by_staff_id INTEGER REFERENCES staff(staff_id) ON DELETE SET NULL
);

CREATE TABLE school_payment_info (
    id SERIAL PRIMARY KEY,
    bank_name VARCHAR(255) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    instructions TEXT
);

CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES parents(parent_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
