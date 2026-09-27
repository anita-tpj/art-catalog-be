-- CreateEnum
CREATE TYPE "ArtworkAvailability" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'NOT_FOR_SALE');

-- AlterTable
ALTER TABLE "Artwork" ADD COLUMN     "availability" "ArtworkAvailability" NOT NULL DEFAULT 'AVAILABLE';
