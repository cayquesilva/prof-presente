/*
  # Add Teacher Badges and Gamification System

  1. Updates
    - Add TEACHER role to UserRole enum

  2. New Tables
    - `teacher_badges`
      - `id` (uuid, primary key)
      - `userId` (uuid, unique, foreign key to users)
      - `qrCodeUrl` (text)
      - `badgeImageUrl` (text)
      - `issuedAt` (timestamp)
      - `createdAt` (timestamp)
      - `updatedAt` (timestamp)

    - `teacher_checkins`
      - `id` (uuid, primary key)
      - `teacherBadgeId` (uuid, foreign key to teacher_badges)
      - `eventId` (uuid)
      - `checkinTime` (timestamp)
      - `location` (text, optional)
      - `createdAt` (timestamp)
      - `updatedAt` (timestamp)

  3. Purpose
    - Enable teachers to have universal badges that work across all events
    - Track teacher attendance and participation for gamification
    - Support ranking system for most active teachers

  4. Security
    - Cascade delete on user deletion to maintain referential integrity
*/

-- AlterEnum: Add TEACHER to UserRole
ALTER TYPE "UserRole" ADD VALUE 'TEACHER';

-- CreateTable: teacher_badges
CREATE TABLE IF NOT EXISTS "teacher_badges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "qrCodeUrl" TEXT NOT NULL,
    "badgeImageUrl" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable: teacher_checkins
CREATE TABLE IF NOT EXISTS "teacher_checkins" (
    "id" TEXT NOT NULL,
    "teacherBadgeId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "checkinTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_checkins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teacher_badges_userId_key" ON "teacher_badges"("userId");
CREATE INDEX "teacher_badges_issuedAt_idx" ON "teacher_badges"("issuedAt");
CREATE INDEX "teacher_badges_createdAt_idx" ON "teacher_badges"("createdAt");

CREATE INDEX "teacher_checkins_teacherBadgeId_idx" ON "teacher_checkins"("teacherBadgeId");
CREATE INDEX "teacher_checkins_eventId_idx" ON "teacher_checkins"("eventId");
CREATE INDEX "teacher_checkins_checkinTime_idx" ON "teacher_checkins"("checkinTime");
CREATE INDEX "teacher_checkins_createdAt_idx" ON "teacher_checkins"("createdAt");

-- AddForeignKey
ALTER TABLE "teacher_badges" ADD CONSTRAINT "teacher_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_checkins" ADD CONSTRAINT "teacher_checkins_teacherBadgeId_fkey" FOREIGN KEY ("teacherBadgeId") REFERENCES "teacher_badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
