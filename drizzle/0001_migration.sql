-- Add new enums if they don't exist
CREATE TYPE "public"."category_request_status" AS ENUM('pending', 'approved', 'rejected');

-- Alter providers table to add new columns
ALTER TABLE "providers" 
ADD COLUMN "registered_categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
ADD COLUMN "additional_categories" jsonb DEFAULT '[]'::jsonb NOT NULL;

-- Migrate existing data from service_categories to registered_categories if it exists
-- Note: If service_categories column exists, uncomment and adjust this:
-- UPDATE "providers" 
-- SET "registered_categories" = COALESCE("service_categories", '[]'::jsonb)
-- WHERE "service_categories" IS NOT NULL;

-- You can optionally drop the old column if it exists:
-- ALTER TABLE "providers" DROP COLUMN "service_categories" IF EXISTS;

-- Create the category_addition_requests table
CREATE TABLE IF NOT EXISTS "category_addition_requests" (
	"id" uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
	"provider_id" uuid NOT NULL,
	"category_id" integer NOT NULL,
	"documents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "category_request_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "category_addition_requests_provider_id_users_id_fk" 
		FOREIGN KEY ("provider_id") REFERENCES "public"."users"("id") ON DELETE cascade,
	CONSTRAINT "category_addition_requests_category_id_categories_id_fk" 
		FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id"),
	CONSTRAINT "category_addition_requests_reviewed_by_users_id_fk" 
		FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id")
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS "category_addition_requests_provider_id_idx" 
	ON "category_addition_requests"("provider_id");

CREATE INDEX IF NOT EXISTS "category_addition_requests_status_idx" 
	ON "category_addition_requests"("status");

CREATE INDEX IF NOT EXISTS "category_addition_requests_provider_id_status_idx" 
	ON "category_addition_requests"("provider_id", "status");
