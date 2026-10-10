-- AlterTable
ALTER TABLE "Artist" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Artwork" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;
