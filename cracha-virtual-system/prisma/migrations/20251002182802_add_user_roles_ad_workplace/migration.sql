/*
  Warnings:

  - The primary key for the `workplaces` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Made the column `created_at` on table `workplaces` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `workplaces` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."users" DROP CONSTRAINT "users_workplace_id_fkey";

-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "workplace_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "public"."workplaces" DROP CONSTRAINT "workplaces_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "workplaces_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_workplace_id_fkey" FOREIGN KEY ("workplace_id") REFERENCES "public"."workplaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "public"."idx_users_workplace_id" RENAME TO "users_workplace_id_idx";

-- RenameIndex
ALTER INDEX "public"."idx_workplaces_city" RENAME TO "workplaces_city_idx";

-- RenameIndex
ALTER INDEX "public"."idx_workplaces_name" RENAME TO "workplaces_name_idx";

-- RenameIndex
ALTER INDEX "public"."idx_workplaces_state" RENAME TO "workplaces_state_idx";
