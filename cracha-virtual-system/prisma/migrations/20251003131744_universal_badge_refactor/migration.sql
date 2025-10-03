/*
  Warnings:

  - The values [USER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `badges` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `checkins` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teacher_badges` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teacher_checkins` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'ORGANIZER', 'CHECKIN_COORDINATOR', 'TEACHER');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'TEACHER';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."badges" DROP CONSTRAINT "badges_enrollmentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."checkins" DROP CONSTRAINT "checkins_badgeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."teacher_badges" DROP CONSTRAINT "teacher_badges_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."teacher_checkins" DROP CONSTRAINT "teacher_checkins_teacherBadgeId_fkey";

-- AlterTable
ALTER TABLE "enrollments" ALTER COLUMN "status" SET DEFAULT 'APPROVED';

-- DropTable
DROP TABLE "public"."badges";

-- DropTable
DROP TABLE "public"."checkins";

-- DropTable
DROP TABLE "public"."teacher_badges";

-- DropTable
DROP TABLE "public"."teacher_checkins";
