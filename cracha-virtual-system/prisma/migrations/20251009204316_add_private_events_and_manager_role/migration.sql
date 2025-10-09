-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'GESTOR_ESCOLA';

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "creator_id" TEXT,
ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "events_creator_id_idx" ON "events"("creator_id");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
