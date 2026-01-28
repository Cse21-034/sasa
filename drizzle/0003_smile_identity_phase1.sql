-- Migration: Add Smile Identity KYC fields for Phase 1 automated verification
-- Date: 2026-01-28
-- Description: Adds fields to support Smile Identity for Phase 1 (identity) verification
--             Phase 1 is now fully automated with no admin approval
--             Phase 2 (documents) remains admin-approved

ALTER TABLE verification_submissions ADD COLUMN IF NOT EXISTS verification_provider TEXT DEFAULT 'smile_identity' NOT NULL;
ALTER TABLE verification_submissions ADD COLUMN IF NOT EXISTS smile_job_id TEXT;
ALTER TABLE verification_submissions ADD COLUMN IF NOT EXISTS smile_result TEXT; -- PASS or FAIL
ALTER TABLE verification_submissions ADD COLUMN IF NOT EXISTS id_type TEXT; -- national_id, passport, driver_licence
ALTER TABLE verification_submissions ADD COLUMN IF NOT EXISTS confidence_score NUMERIC;
ALTER TABLE verification_submissions ADD COLUMN IF NOT EXISTS phase1_verified BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE verification_submissions ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;

-- Add comment explaining the new schema
COMMENT ON COLUMN verification_submissions.verification_provider IS 'Provider of verification: smile_identity (Phase 1 automated) or manual (Phase 2 admin-approved)';
COMMENT ON COLUMN verification_submissions.smile_job_id IS 'Smile Identity API job ID for tracking and audit';
COMMENT ON COLUMN verification_submissions.smile_result IS 'Smile Identity result: PASS or FAIL';
COMMENT ON COLUMN verification_submissions.id_type IS 'Type of ID document: national_id, passport, or driver_licence';
COMMENT ON COLUMN verification_submissions.confidence_score IS 'Smile Identity confidence score (0-100)';
COMMENT ON COLUMN verification_submissions.phase1_verified IS 'Indicates if Phase 1 identity verification passed (true) or failed (false)';
COMMENT ON COLUMN verification_submissions.verified_at IS 'Timestamp when Phase 1 verification was completed (only if phase1_verified = true)';
