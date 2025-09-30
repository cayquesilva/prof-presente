/*
  # Add Universal User Badges

  1. New Tables
    - `user_badges`
      - `id` (uuid, primary key)
      - `userId` (uuid, unique, foreign key to users)
      - `badgeCode` (text, unique - human readable code)
      - `qrCodeUrl` (text)
      - `badgeImageUrl` (text)
      - `issuedAt` (timestamp)
      - `createdAt` (timestamp)
      - `updatedAt` (timestamp)

    - `user_checkins`
      - `id` (uuid, primary key)
      - `userBadgeId` (uuid, foreign key to user_badges)
      - `eventId` (uuid - reference to which event the checkin was made)
      - `checkinTime` (timestamp)
      - `location` (text, optional)
      - `createdAt` (timestamp)
      - `updatedAt` (timestamp)

  2. Purpose
    - Create universal badges for all users (not event-specific)
    - Allow users to use one badge for check-in to any enrolled event
    - Track user check-ins across all events
    - Human-readable badge codes for manual entry

  3. Security
    - Cascade delete on user deletion
    - Unique constraints on userId and badgeCode
    - Indexed fields for performance
*/

-- CreateTable: user_badges
CREATE TABLE IF NOT EXISTS "user_badges" (
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

-- CreateTable: user_checkins
CREATE TABLE IF NOT EXISTS "user_checkins" (
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
CREATE UNIQUE INDEX "user_badges_userId_key" ON "user_badges"("userId");
CREATE UNIQUE INDEX "user_badges_badgeCode_key" ON "user_badges"("badgeCode");
CREATE INDEX "user_badges_badgeCode_idx" ON "user_badges"("badgeCode");
CREATE INDEX "user_badges_issuedAt_idx" ON "user_badges"("issuedAt");
CREATE INDEX "user_badges_createdAt_idx" ON "user_badges"("createdAt");

CREATE INDEX "user_checkins_userBadgeId_idx" ON "user_checkins"("userBadgeId");
CREATE INDEX "user_checkins_eventId_idx" ON "user_checkins"("eventId");
CREATE INDEX "user_checkins_checkinTime_idx" ON "user_checkins"("checkinTime");
CREATE INDEX "user_checkins_createdAt_idx" ON "user_checkins"("createdAt");

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_checkins" ADD CONSTRAINT "user_checkins_userBadgeId_fkey" FOREIGN KEY ("userBadgeId") REFERENCES "user_badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
