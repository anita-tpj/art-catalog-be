-- AlterTable
ALTER TABLE "CloudinaryImage" ADD COLUMN     "deletionLeaseExpiresAt" TIMESTAMP(3),
ADD COLUMN     "deletionLeaseToken" TEXT;
