-- CreateEnum
CREATE TYPE "ArtworkOrigin" AS ENUM ('ORIGINAL', 'BASED_ON_REFERENCE', 'REPRODUCTION');

-- AlterTable
ALTER TABLE "Artwork" ADD COLUMN     "origin" "ArtworkOrigin" NOT NULL DEFAULT 'ORIGINAL';
