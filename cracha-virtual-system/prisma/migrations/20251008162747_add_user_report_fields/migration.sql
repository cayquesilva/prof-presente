-- CreateEnum
CREATE TYPE "WorkShift" AS ENUM ('MANHA', 'TARDE', 'NOITE', 'INTEGRAL');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('EFETIVO', 'PRESTADOR');

-- CreateEnum
CREATE TYPE "TeachingSegment" AS ENUM ('INFANTIL', 'FUNDAMENTAL1', 'FUNDAMENTAL2', 'EJA');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "contractType" "ContractType",
ADD COLUMN     "neighborhood" TEXT,
ADD COLUMN     "profession_id" TEXT,
ADD COLUMN     "teachingSegment" "TeachingSegment",
ADD COLUMN     "workShift" "WorkShift";

-- CreateTable
CREATE TABLE "professions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "professions_name_key" ON "professions"("name");

-- CreateIndex
CREATE INDEX "users_profession_id_idx" ON "users"("profession_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_profession_id_fkey" FOREIGN KEY ("profession_id") REFERENCES "professions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
