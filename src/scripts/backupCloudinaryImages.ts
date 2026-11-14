import { CloudinaryImageStatus } from "@prisma/client";
import "dotenv/config";
import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, readFile, rename, rm, stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import cloudinary from "../libs/cloudinary";
import prisma from "../prisma";

const backupDir = path.join(
  homedir(),
  "Backups",
  "creative-atlas",
  "cloudinary",
);

const manifestPath = path.join(backupDir, "manifest.json");

type BackupEntry = {
  publicId: string;
  resourceType: string;
  status: string;
  cloudinaryType: string;
  format: string;
  filename: string;
  size: number;
  sha256: string;
  backedUpAt: string;
};

type BackupManifest = {
  version: 1;
  images: Record<string, BackupEntry>;
};

function getHttpCode(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return;

  const value = error as {
    http_code?: number;
    error?: { http_code?: number };
  };

  return value.error?.http_code ?? value.http_code;
}

async function findResource(publicId: string) {
  for (const type of ["private", "upload"] as const) {
    try {
      return await cloudinary.api.resource(publicId, {
        resource_type: "image",
        type,
      });
    } catch (error) {
      if (getHttpCode(error) === 404) continue;

      throw new Error(
        `Cloudinary lookup failed (HTTP ${getHttpCode(error) ?? "unknown"})`,
      );
    }
  }

  throw new Error("Cloudinary resource not found");
}

async function hashFile(filename: string): Promise<string> {
  const buffer = await readFile(filename);
  return createHash("sha256").update(buffer).digest("hex");
}

async function main() {
  await mkdir(backupDir, { recursive: true, mode: 0o700 });

  let manifest: BackupManifest = {
    version: 1,
    images: {},
  };

  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    if (
      manifest.version !== 1 ||
      !manifest.images ||
      typeof manifest.images !== "object" ||
      Array.isArray(manifest.images)
    ) {
      throw new Error("Invalid backup manifest");
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  const images = await prisma.cloudinaryImage.findMany({
    where: {
      status: {
        in: [
          CloudinaryImageStatus.ATTACHED,
          CloudinaryImageStatus.PENDING_DELETE,
        ],
      },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Images to back up: ${images.length}`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const image of images) {
    try {
      const existing = manifest.images[image.publicId];

      if (existing) {
        const existingPath = path.join(backupDir, existing.filename);

        try {
          const info = await stat(existingPath);
          const sha256 = await hashFile(existingPath);

          if (info.size === existing.size && sha256 === existing.sha256) {
            existing.status = image.status;
            skipped++;
            console.log(`SKIP ${image.publicId}`);
            continue;
          }
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
            throw error;
          }
        }

        throw new Error(
          "Existing backup missing or checksum mismatch; manual review required",
        );
      }

      const resource = await findResource(image.publicId);

      const format = resource.format as string | undefined;
      if (!format || !/^[a-zA-Z0-9]+$/.test(format)) {
        throw new Error("Invalid Cloudinary resource format");
      }

      const filename = `${image.id}.${format}`;
      const destination = path.join(backupDir, filename);
      const temporaryFile = `${destination}.part`;

      const downloadUrl = cloudinary.utils.private_download_url(
        image.publicId,
        format,
        {
          resource_type: "image",
          type: resource.type,
          expires_at: Math.floor(Date.now() / 1000) + 300,
        },
      );

      const response = await fetch(downloadUrl);

      if (!response.ok || !response.body) {
        throw new Error(`Download failed (HTTP ${response.status})`);
      }

      try {
        await pipeline(
          Readable.fromWeb(
            response.body as Parameters<typeof Readable.fromWeb>[0],
          ),
          createWriteStream(temporaryFile, {
            flags: "wx",
            mode: 0o600,
          }),
        );

        const info = await stat(temporaryFile);
        const sha256 = await hashFile(temporaryFile);

        if (info.size === 0) {
          throw new Error("Downloaded file is empty");
        }

        if (
          typeof resource.bytes === "number" &&
          info.size !== resource.bytes
        ) {
          throw new Error(
            `Size mismatch: downloaded ${info.size}, expected ${resource.bytes}`,
          );
        }

        await rename(temporaryFile, destination);

        manifest.images[image.publicId] = {
          publicId: image.publicId,
          resourceType: image.resourceType,
          status: image.status,
          cloudinaryType: resource.type,
          format,
          filename,
          size: info.size,
          sha256,
          backedUpAt: new Date().toISOString(),
        };

        // Save progress after each successful image.
        const manifestTemp = `${manifestPath}.tmp`;
        await rm(manifestTemp, { force: true });
        await import("node:fs/promises").then(({ writeFile }) =>
          writeFile(manifestTemp, JSON.stringify(manifest, null, 2), {
            mode: 0o600,
          }),
        );
        await rename(manifestTemp, manifestPath);

        downloaded++;
        console.log(`OK   ${image.publicId}`);
      } catch (error) {
        await rm(temporaryFile, { force: true });
        throw error;
      }
    } catch (error) {
      failed++;
      const message =
        error instanceof Error ? error.message : "Unknown backup error";

      console.error(`FAIL ${image.publicId}: ${message}`);
    }
  }

  console.log("\nBackup summary:");
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Already verified: ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`Manifest: ${manifestPath}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Backup failed");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
