-- Migration: Fix Phase 1 Verification - Remove System Reviewer
-- Date: 2026-01-30
-- Description: Phase 1 (Identity) verification is fully automated via Smile Identity
--             There should be NO reviewer (reviewed_by) or review timestamp
--             reviewed_by MUST be NULL for all Phase 1 submissions

-- Ensure reviewed_by column allows NULL (it should already)
ALTER TABLE verification_submissions 
ALTER COLUMN reviewed_by DROP NOT NULL;

-- Clear any non-NULL reviewed_by values for Phase 1 (type='identity') submissions
-- Phase 1 uses automated verification - no manual review/approval
UPDATE verification_submissions 
SET reviewed_by = NULL, reviewed_at = NULL
WHERE type = 'identity' AND verification_provider = 'smile_identity';

-- Add constraint to document that Phase 1 submissions should never have a reviewer
COMMENT ON TABLE verification_submissions IS 'Verification submissions: Phase 1 (identity, automated via Smile) has no reviewer. Phase 2 (documents, manual) requires admin review.';

-- Add index for faster Phase 1 lookups
CREATE INDEX IF NOT EXISTS idx_verification_phase1 
ON verification_submissions(user_id, type) 
WHERE type = 'identity';
