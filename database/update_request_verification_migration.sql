-- Migration: Add ID verification fields to requests and remove student BEMIS ID
-- Run this to update the schema structure

-- Add ID verification columns to document_requests
ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS id_image_path TEXT;
ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT FALSE;

-- Remove student_bemis_id column from document_requests
ALTER TABLE document_requests DROP COLUMN IF EXISTS student_bemis_id;
