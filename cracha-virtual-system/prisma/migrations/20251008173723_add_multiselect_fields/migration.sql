/*
  Warnings:

  - You are about to drop the column `teachingSegment` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `workShift` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "teachingSegment",
DROP COLUMN "workShift",
ADD COLUMN     "teachingSegments" "TeachingSegment"[],
ADD COLUMN     "workShifts" "WorkShift"[];
