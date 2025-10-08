/*
  Warnings:

  - You are about to drop the column `workplace_id` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."users" DROP CONSTRAINT "users_workplace_id_fkey";

-- DropIndex
DROP INDEX "public"."users_workplace_id_idx";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "workplace_id";

-- CreateTable
CREATE TABLE "_UserWorkplaces" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserWorkplaces_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_UserWorkplaces_B_index" ON "_UserWorkplaces"("B");

-- AddForeignKey
ALTER TABLE "_UserWorkplaces" ADD CONSTRAINT "_UserWorkplaces_A_fkey" FOREIGN KEY ("A") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserWorkplaces" ADD CONSTRAINT "_UserWorkplaces_B_fkey" FOREIGN KEY ("B") REFERENCES "workplaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
