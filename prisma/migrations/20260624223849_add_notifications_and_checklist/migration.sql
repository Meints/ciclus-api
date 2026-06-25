-- AlterTable
ALTER TABLE "services" ADD COLUMN     "checklist_data" JSONB;

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_company_id_read_at_idx" ON "notifications"("company_id", "read_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
