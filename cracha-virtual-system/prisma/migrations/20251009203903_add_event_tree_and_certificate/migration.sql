-- AlterTable
ALTER TABLE "events" ADD COLUMN     "certificate_template_url" TEXT,
ADD COLUMN     "parent_id" TEXT;

-- CreateIndex
CREATE INDEX "events_parent_id_idx" ON "events"("parent_id");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
