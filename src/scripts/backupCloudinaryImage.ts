import "dotenv/config";
import { createWriteStream } from "node:fs";
import { mkdir, rename, rm } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import cloudinary from "../libs/cloudinary";
import prisma from "../prisma";

async function main() {
  const publicId = process.argv[2];

  if (!publicId) {
    throw new Error(
      "Usage: npx tsx src/scripts/backupCloudinaryImage.ts <publicId>",
    );
  }

  // Only back up images registered in our database.
  const image = await prisma.cloudinaryImage.findUnique({
    where: { publicId },
  });

  if (!image) {
    throw new Error(`Image not found in database: ${publicId}`);
  }

  // Legacy images may use "upload" instead of "private".
  let resource: Awaited<ReturnType<typeof cloudinary.api.resource>> | undefined;

  for (const type of ["private", "upload"] as const) {
    try {
      resource = await cloudinary.api.resource(publicId, {
        resource_type: "image",
        type,
      });
      break;
    } catch (error: unknown) {
      const cloudinaryError =
        typeof error === "object" && error !== null && "error" in error
          ? (error as { error?: { http_code?: number } }).error
          : undefined;

      const statusCode =
        cloudinaryError?.http_code ??
        (typeof error === "object" && error !== null && "http_code" in error
          ? (error as { http_code?: number }).http_code
          : undefined);

      if (statusCode === 404) {
        continue;
      }

      throw new Error(
        `Cloudinary resource lookup failed (HTTP ${statusCode ?? "unknown"})`,
      );
    }
  }

  if (!resource) {
    throw new Error(`Cloudinary resource not found: ${publicId}`);
  }

  const backupDir = path.join(
    homedir(),
    "Backups",
    "creative-atlas",
    "cloudinary",
  );

  await mkdir(backupDir, { recursive: true, mode: 0o700 });

  const extension = resource.format;
  if (!extension || !/^[a-zA-Z0-9]+$/.test(extension)) {
    throw new Error("Unexpected Cloudinary image format");
  }

  // Use the DB ID as a safe local filename.
  const filename = `${image.id}.${extension}`;
  const destination = path.join(backupDir, filename);
  const temporaryFile = `${destination}.part`;

  // Signed URL for the original, without any transformations.
  const downloadUrl = cloudinary.utils.private_download_url(
    publicId,
    extension,
    {
      resource_type: "image",
      type: resource.type,
      expires_at: Math.floor(Date.now() / 1000) + 300,
    },
  );

  const response = await fetch(downloadUrl);

  if (!response.ok || !response.body) {
    throw new Error(`Download failed: HTTP ${response.status}`);
  }

  try {
    await pipeline(
      Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]),
      createWriteStream(temporaryFile, { flags: "wx", mode: 0o600 }),
    );

    await rename(temporaryFile, destination);
  } catch (error) {
    await rm(temporaryFile, { force: true });
    throw error;
  }

  console.log("Backup completed:");
  console.log(`Public ID: ${publicId}`);
  console.log(`Cloudinary type: ${resource.type}`);
  console.log(`Original format: ${extension}`);
  console.log(`Saved to: ${destination}`);
  console.log("No database or Cloudinary changes made.");
}

main()
  .catch((error) => {
    console.error(
      error instanceof Error ? error.message : "Cloudinary backup failed",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
