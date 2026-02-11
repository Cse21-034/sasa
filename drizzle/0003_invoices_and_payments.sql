-- Create payment method enum
CREATE TYPE "payment_method" AS ENUM ('cash', 'bank_transfer', 'card');

-- Create invoice status enum
CREATE TYPE "invoice_status" AS ENUM ('draft', 'sent', 'approved', 'declined', 'paid', 'cancelled');

-- Create payment status enum
CREATE TYPE "payment_status" AS ENUM ('unpaid', 'paid');

-- Alter jobs table to add invoice-related columns
ALTER TABLE "jobs" ADD COLUMN "invoice_id" uuid;
ALTER TABLE "jobs" ADD COLUMN "invoice_status" text DEFAULT 'no_invoice';
ALTER TABLE "jobs" ADD COLUMN "payment_status" "payment_status" DEFAULT 'unpaid';

-- Create invoices table
CREATE TABLE "invoices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "job_id" uuid NOT NULL UNIQUE REFERENCES "jobs"("id") ON DELETE CASCADE,
  "provider_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "requester_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status" "invoice_status" NOT NULL DEFAULT 'draft',
  "amount" numeric(10, 2) NOT NULL,
  "currency" text NOT NULL DEFAULT 'BWP',
  "description" text NOT NULL,
  "payment_method" "payment_method" NOT NULL,
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "sent_at" timestamp,
  "approved_at" timestamp,
  "declined_at" timestamp,
  "paid_at" timestamp,
  "expires_at" timestamp,
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE "payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoice_id" uuid NOT NULL UNIQUE REFERENCES "invoices"("id") ON DELETE CASCADE,
  "job_id" uuid NOT NULL REFERENCES "jobs"("id") ON DELETE CASCADE,
  "amount" numeric(10, 2) NOT NULL,
  "payment_method" "payment_method" NOT NULL,
  "payment_status" "payment_status" NOT NULL DEFAULT 'unpaid',
  "transaction_id" text,
  "paid_at" timestamp,
  "notes" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX "invoices_job_id_idx" ON "invoices"("job_id");
CREATE INDEX "invoices_provider_id_idx" ON "invoices"("provider_id");
CREATE INDEX "invoices_requester_id_idx" ON "invoices"("requester_id");
CREATE INDEX "invoices_status_idx" ON "invoices"("status");
CREATE INDEX "invoices_created_at_idx" ON "invoices"("created_at");

CREATE INDEX "payments_invoice_id_idx" ON "payments"("invoice_id");
CREATE INDEX "payments_job_id_idx" ON "payments"("job_id");
CREATE INDEX "payments_payment_status_idx" ON "payments"("payment_status");
CREATE INDEX "payments_created_at_idx" ON "payments"("created_at");

CREATE INDEX "jobs_invoice_id_idx" ON "jobs"("invoice_id");
CREATE INDEX "jobs_payment_status_idx" ON "jobs"("payment_status");
