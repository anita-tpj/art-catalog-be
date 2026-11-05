-- CreateTable
CREATE TABLE "AdminPasswordResetToken" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminPasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminPasswordResetToken_tokenHash_key" ON "AdminPasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AdminPasswordResetToken_adminUserId_idx" ON "AdminPasswordResetToken"("adminUserId");

-- CreateIndex
CREATE INDEX "AdminPasswordResetToken_expiresAt_idx" ON "AdminPasswordResetToken"("expiresAt");

-- AddForeignKey
ALTER TABLE "AdminPasswordResetToken" ADD CONSTRAINT "AdminPasswordResetToken_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
