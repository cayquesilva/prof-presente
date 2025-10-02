/*
  Warnings:

  - You are about to drop the column `enrollmentId` on the `checkins` table. All the data in the column will be lost.
  - Added the required column `badgeId` to the `checkins` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."checkins" DROP CONSTRAINT "checkins_enrollmentId_fkey";

-- DropIndex
DROP INDEX "public"."checkins_enrollmentId_idx";

-- AlterTable
ALTER TABLE "checkins" DROP COLUMN "enrollmentId",
ADD COLUMN     "badgeId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "qrCodeUrl" TEXT NOT NULL,
    "badgeImageUrl" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_badges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "qrCodeUrl" TEXT NOT NULL,
    "badgeImageUrl" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_checkins" (
    "id" TEXT NOT NULL,
    "teacherBadgeId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "checkinTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeCode" TEXT NOT NULL,
    "qrCodeUrl" TEXT NOT NULL,
    "badgeImageUrl" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_checkins" (
    "id" TEXT NOT NULL,
    "userBadgeId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "checkinTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_checkins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "badges_enrollmentId_key" ON "badges"("enrollmentId");

-- CreateIndex
CREATE INDEX "badges_issuedAt_idx" ON "badges"("issuedAt");

-- CreateIndex
CREATE INDEX "badges_validUntil_idx" ON "badges"("validUntil");

-- CreateIndex
CREATE INDEX "badges_createdAt_idx" ON "badges"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_badges_userId_key" ON "teacher_badges"("userId");

-- CreateIndex
CREATE INDEX "teacher_badges_issuedAt_idx" ON "teacher_badges"("issuedAt");

-- CreateIndex
CREATE INDEX "teacher_badges_createdAt_idx" ON "teacher_badges"("createdAt");

-- CreateIndex
CREATE INDEX "teacher_checkins_teacherBadgeId_idx" ON "teacher_checkins"("teacherBadgeId");

-- CreateIndex
CREATE INDEX "teacher_checkins_eventId_idx" ON "teacher_checkins"("eventId");

-- CreateIndex
CREATE INDEX "teacher_checkins_checkinTime_idx" ON "teacher_checkins"("checkinTime");

-- CreateIndex
CREATE INDEX "teacher_checkins_createdAt_idx" ON "teacher_checkins"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_userId_key" ON "user_badges"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_badgeCode_key" ON "user_badges"("badgeCode");

-- CreateIndex
CREATE INDEX "user_badges_badgeCode_idx" ON "user_badges"("badgeCode");

-- CreateIndex
CREATE INDEX "user_badges_issuedAt_idx" ON "user_badges"("issuedAt");

-- CreateIndex
CREATE INDEX "user_badges_createdAt_idx" ON "user_badges"("createdAt");

-- CreateIndex
CREATE INDEX "user_checkins_userBadgeId_idx" ON "user_checkins"("userBadgeId");

-- CreateIndex
CREATE INDEX "user_checkins_eventId_idx" ON "user_checkins"("eventId");

-- CreateIndex
CREATE INDEX "user_checkins_checkinTime_idx" ON "user_checkins"("checkinTime");

-- CreateIndex
CREATE INDEX "user_checkins_createdAt_idx" ON "user_checkins"("createdAt");

-- CreateIndex
CREATE INDEX "checkins_badgeId_idx" ON "checkins"("badgeId");

-- AddForeignKey
ALTER TABLE "badges" ADD CONSTRAINT "badges_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_badges" ADD CONSTRAINT "teacher_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_checkins" ADD CONSTRAINT "teacher_checkins_teacherBadgeId_fkey" FOREIGN KEY ("teacherBadgeId") REFERENCES "teacher_badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_checkins" ADD CONSTRAINT "user_checkins_userBadgeId_fkey" FOREIGN KEY ("userBadgeId") REFERENCES "user_badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
