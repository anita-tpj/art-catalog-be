-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ItemVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "Artist"
ADD COLUMN "status" "ItemStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN "visibility" "ItemVisibility" NOT NULL DEFAULT 'PRIVATE';

-- AlterTable
ALTER TABLE "Artwork"
ADD COLUMN "status" "ItemStatus" NOT NULL DEFAULT 'DRAFT';

-- Keep existing content live
UPDATE "Artist"
SET
    "status" = 'PUBLISHED',
    "visibility" = 'PUBLIC';

UPDATE "Artwork"
SET
    "status" = 'PUBLISHED';