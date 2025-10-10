-- CreateTable
CREATE TABLE "CertificateLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "details" TEXT,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CertificateLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CertificateLog_eventId_idx" ON "CertificateLog"("eventId");

-- CreateIndex
CREATE INDEX "CertificateLog_userId_idx" ON "CertificateLog"("userId");

-- AddForeignKey
ALTER TABLE "CertificateLog" ADD CONSTRAINT "CertificateLog_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateLog" ADD CONSTRAINT "CertificateLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
