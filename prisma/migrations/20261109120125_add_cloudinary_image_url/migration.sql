/*
  Warnings:

  - Added the required column `url` to the `CloudinaryImage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CloudinaryImage" ADD COLUMN     "url" TEXT NOT NULL;
