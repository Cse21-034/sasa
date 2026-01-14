-- Create provider category verification status enum
CREATE TYPE "provider_category_verification_status" AS ENUM ('pending', 'approved', 'rejected');

-- Create provider_category_verifications table
CREATE TABLE "provider_category_verifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "provider_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "category_id" integer NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
  "status" "provider_category_verification_status" NOT NULL DEFAULT 'pending',
  "documents" jsonb NOT NULL DEFAULT '[]',
  "rejection_reason" text,
  "reviewed_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "reviewed_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  UNIQUE("provider_id", "category_id")
);

-- Create index for efficient lookups
CREATE INDEX "provider_category_verifications_provider_id_idx" ON "provider_category_verifications"("provider_id");
CREATE INDEX "provider_category_verifications_status_idx" ON "provider_category_verifications"("status");
CREATE INDEX "provider_category_verifications_created_at_idx" ON "provider_category_verifications"("created_at");
