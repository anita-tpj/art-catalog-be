-- CreateEnum
CREATE TYPE "ArtworkCategory" AS ENUM ('PAINTING', 'SCULPTURE', 'PHOTOGRAPHY', 'DRAWING_ILLUSTRATION', 'PRINTMAKING', 'DIGITAL_ART', 'MIXED_MEDIA', 'TEXTILE_FIBER_ART', 'CERAMICS', 'OTHER');

-- CreateEnum
CREATE TYPE "ArtworkTechnique" AS ENUM ('OIL', 'ACRYLIC', 'WATERCOLOR', 'GOUACHE', 'INK', 'MIXED_MEDIA', 'DIGITAL_PAINTING', 'PASTEL', 'PENCIL', 'CHARCOAL', 'PRINT', 'SPRAY_PAINT', 'COLLAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "ArtworkStyle" AS ENUM ('REALISM', 'ABSTRACT', 'EXPRESSIONISM', 'IMPRESSIONISM', 'MINIMALISM', 'SURREALISM', 'POP_ART', 'CUBISM', 'CONTEMPORARY', 'STREET_ART', 'FIGURATIVE', 'CONCEPTUAL', 'MODERN', 'OTHER');

-- CreateEnum
CREATE TYPE "ArtworkMotive" AS ENUM ('PORTRAIT', 'LANDSCAPE', 'STILL_LIFE', 'ANIMALS', 'FIGURE', 'CITYSCAPE', 'NATURE', 'RELIGIOUS_MYTHOLOGICAL', 'FANTASY_SCI_FI', 'GEOMETRIC', 'TYPOGRAPHY', 'SOCIAL_POLITICAL', 'OTHER');

-- CreateEnum
CREATE TYPE "ArtworkOrientation" AS ENUM ('PORTRAIT', 'LANDSCAPE', 'SQUARE', 'PANORAMIC');

-- CreateEnum
CREATE TYPE "ArtworkStandardSize" AS ENUM ('SIZE_30x40', 'SIZE_40x50', 'SIZE_50x70', 'SIZE_60x80', 'SIZE_70x100', 'A4_21x29_7', 'A3_29_7x42', 'A2_42x59_4', 'CUSTOM');

-- CreateTable
CREATE TABLE "Artist" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "country" TEXT,
    "birthYear" INTEGER,
    "deathYear" INTEGER,
    "avatarUrl" TEXT,
    "avatarPublicId" TEXT,
    "primaryCategory" "ArtworkCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artwork" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER,
    "description" TEXT,
    "imageUrl" TEXT,
    "imagePublicId" TEXT,
    "technique" "ArtworkTechnique",
    "style" "ArtworkStyle",
    "motive" "ArtworkMotive",
    "orientation" "ArtworkOrientation",
    "size" "ArtworkStandardSize",
    "framed" BOOLEAN NOT NULL DEFAULT false,
    "artistId" INTEGER NOT NULL,
    "category" "ArtworkCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artwork_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Artwork" ADD CONSTRAINT "Artwork_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
