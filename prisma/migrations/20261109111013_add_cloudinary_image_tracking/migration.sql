-- CreateEnum
CREATE TYPE "CloudinaryImageStatus" AS ENUM ('TEMPORARY', 'ATTACHED', 'PENDING_DELETE', 'DELETED');

-- CreateEnum
CREATE TYPE "CloudinaryImageType" AS ENUM ('ARTIST_AVATAR', 'ARTWORK_IMAGE');

-- CreateTable
CREATE TABLE "CloudinaryImage" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "uploadedById" TEXT,
    "resourceType" "CloudinaryImageType" NOT NULL,
    "status" "CloudinaryImageStatus" NOT NULL DEFAULT 'TEMPORARY',
    "deleteAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastDeleteError" TEXT,
    "nextRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CloudinaryImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CloudinaryImage_publicId_key" ON "CloudinaryImage"("publicId");

-- CreateIndex
CREATE INDEX "CloudinaryImage_status_nextRetryAt_idx" ON "CloudinaryImage"("status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "CloudinaryImage_uploadedById_idx" ON "CloudinaryImage"("uploadedById");
