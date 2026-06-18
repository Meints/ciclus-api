-- AlterEnum: add CONFIRMED to ServiceStatus
ALTER TYPE "ServiceStatus" ADD VALUE 'CONFIRMED';

-- AlterTable: companies
ALTER TABLE "companies" ADD COLUMN "fantasy_name" TEXT;
ALTER TABLE "companies" ADD COLUMN "email" TEXT;
ALTER TABLE "companies" ADD COLUMN "phone" TEXT;
ALTER TABLE "companies" ADD COLUMN "niche" TEXT NOT NULL DEFAULT 'GENERAL';
ALTER TABLE "companies" ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'FREE';
ALTER TABLE "companies" ADD COLUMN "address" JSONB;
ALTER TABLE "companies" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "companies" ADD COLUMN "data_consent_at" TIMESTAMP(3);
ALTER TABLE "companies" ADD COLUMN "trial_ends_at" TIMESTAMP(3);

-- AlterTable: users
ALTER TABLE "users" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "last_login_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "refresh_token_hash" TEXT;
ALTER TABLE "users" ADD COLUMN "reset_password_token" TEXT;
ALTER TABLE "users" ADD COLUMN "reset_password_expires_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- AlterTable: customers
ALTER TABLE "customers" ADD COLUMN "fantasy_name" TEXT;
ALTER TABLE "customers" ADD COLUMN "document_type" TEXT NOT NULL DEFAULT 'CNPJ';
ALTER TABLE "customers" ALTER COLUMN "address" TYPE JSONB USING CASE WHEN "address" IS NULL THEN NULL ELSE to_jsonb("address") END;
ALTER TABLE "customers" DROP COLUMN IF EXISTS "address_old";
DROP INDEX IF EXISTS "customers_company_id_email_key";
ALTER TABLE "customers" DROP CONSTRAINT IF EXISTS "customers_company_id_email_key";
CREATE UNIQUE INDEX "customers_company_id_document_key" ON "customers"("company_id", "document");

-- AlterTable: services
ALTER TABLE "services" DROP COLUMN IF EXISTS "signature_url";
ALTER TABLE "services" DROP COLUMN IF EXISTS "photos";
ALTER TABLE "services" ADD COLUMN "service_type" TEXT;
ALTER TABLE "services" ADD COLUMN "execution_notes" TEXT;
ALTER TABLE "services" ADD COLUMN "report_url" TEXT;
ALTER TABLE "services" ADD COLUMN "confirmation_token" TEXT;
ALTER TABLE "services" ADD COLUMN "confirmation_token_expires_at" TIMESTAMP(3);
ALTER TABLE "services" ADD COLUMN "confirmed_at" TIMESTAMP(3);
ALTER TABLE "services" ADD COLUMN "confirmed_ip" TEXT;
ALTER TABLE "services" ADD COLUMN "confirmed_user_agent" TEXT;
ALTER TABLE "services" ADD COLUMN "cancelled_reason" TEXT;
CREATE UNIQUE INDEX "services_confirmation_token_key" ON "services"("confirmation_token");

-- CreateTable: equipment
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "capacity" TEXT,
    "serial_number" TEXT,
    "location" TEXT,
    "installed_at" TIMESTAMP(3),
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable: service_equipment
CREATE TABLE "service_equipment" (
    "id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "equipment_id" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "service_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable: service_photos
CREATE TABLE "service_photos" (
    "id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE INDEX "equipment_company_id_idx" ON "equipment"("company_id");
CREATE INDEX "equipment_customer_id_idx" ON "equipment"("customer_id");
CREATE UNIQUE INDEX "service_equipment_service_id_equipment_id_key" ON "service_equipment"("service_id", "equipment_id");
CREATE INDEX "service_photos_service_id_idx" ON "service_photos"("service_id");

-- AddForeignKeys
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "service_equipment" ADD CONSTRAINT "service_equipment_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_equipment" ADD CONSTRAINT "service_equipment_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "service_photos" ADD CONSTRAINT "service_photos_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
