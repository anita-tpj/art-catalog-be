/*
  Warnings:

  - The `size` column on the `Artwork` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ArtworkMotive" ADD VALUE 'ABSTRACT';
ALTER TYPE "ArtworkMotive" ADD VALUE 'ARCHITECTURE';

-- AlterTable
ALTER TABLE "Artwork"
ADD COLUMN "medium" TEXT;

ALTER TABLE "Artwork"
ALTER COLUMN "size" TYPE TEXT
USING "size"::TEXT;

-- DropEnum
DROP TYPE "ArtworkStandardSize";
