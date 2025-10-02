/*
  Warnings:

  - You are about to drop the column `badgeId` on the `checkins` table. All the data in the column will be lost.
  - You are about to drop the `badges` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teacher_badges` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teacher_checkins` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_badges` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_checkins` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `enrollmentId` to the `checkins` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."badges" DROP CONSTRAINT "badges_enrollmentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."checkins" DROP CONSTRAINT "checkins_badgeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."teacher_badges" DROP CONSTRAINT "teacher_badges_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."teacher_checkins" DROP CONSTRAINT "teacher_checkins_teacherBadgeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_badges" DROP CONSTRAINT "user_badges_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_checkins" DROP CONSTRAINT "user_checkins_userBadgeId_fkey";

-- DropIndex
DROP INDEX "public"."checkins_badgeId_idx";

-- AlterTable
ALTER TABLE "checkins" DROP COLUMN "badgeId",
ADD COLUMN     "enrollmentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'TEACHER';

-- DropTable
DROP TABLE "public"."badges";

-- DropTable
DROP TABLE "public"."teacher_badges";

-- DropTable
DROP TABLE "public"."teacher_checkins";

-- DropTable
DROP TABLE "public"."user_badges";

-- DropTable
DROP TABLE "public"."user_checkins";

-- CreateIndex
CREATE INDEX "checkins_enrollmentId_idx" ON "checkins"("enrollmentId");

-- AddForeignKey
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
