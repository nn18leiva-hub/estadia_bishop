-- Migration: Add ID verification fields to requests and remove deprecated columns
-- Run this to update an existing database to the current schema

-- Add ID verification columns to document_requests (idempotent)
ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS id_image_path TEXT;
ALTER TABLE document_requests ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT FALSE;

-- Remove student_bemis_id column (deprecated — no longer collected)
ALTER TABLE document_requests DROP COLUMN IF EXISTS student_bemis_id;

-- Remove ssn_card_image_path from parents (deprecated — ID is now per-request)
ALTER TABLE parents DROP COLUMN IF EXISTS ssn_card_image_path;
