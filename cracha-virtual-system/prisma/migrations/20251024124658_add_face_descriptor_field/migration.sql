-- AlterTable
ALTER TABLE "users" ADD COLUMN     "face_descriptor" JSONB,
ADD COLUMN     "has_consent_facial_recognition" BOOLEAN NOT NULL DEFAULT false;
