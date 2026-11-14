import "dotenv/config";

import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { CloudinaryImageStatus } from "@prisma/client";
import { createHash } from "node:crypto";

import cloudinary from "../libs/cloudinary";
import r2, { r2Bucket } from "../libs/r2";
import prisma from "../prisma";
import { hasVerifiedR2Backup } from "../services/r2Backup.service";

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

const manifestKey = "cloudinary/manifest.json";

function getHttpCode(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const value = error as {
    http_code?: number;
    error?: { http_code?: number };
  };

  return value.error?.http_code ?? value.http_code;
}

function getErrorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const value = error as {
    $metadata?: { httpStatusCode?: number };
  };

  return value.$metadata?.httpStatusCode;
}

async function findResource(publicId: string) {
  for (const type of ["private", "upload"] as const) {
    try {
      return await cloudinary.api.resource(publicId, {
        resource_type: "image",
        type,
      });
    } catch (error) {
      if (getHttpCode(error) === 404) {
        continue;
      }

      throw new Error(
        `Cloudinary lookup failed (HTTP ${getHttpCode(error) ?? "unknown"})`,
      );
    }
  }

  throw new Error("Cloudinary resource not found");
}

async function readManifest(): Promise<{
  manifest: BackupManifest;
  etag: string;
}> {
  try {
    const response = await r2.send(
      new GetObjectCommand({
        Bucket: r2Bucket,
        Key: manifestKey,
      }),
    );

    if (!response.Body || !response.ETag) {
      throw new Error("R2 manifest or ETag is missing");
    }

    const manifest: BackupManifest = JSON.parse(
      await response.Body.transformToString(),
    );

    if (
      manifest.version !== 1 ||
      !manifest.images ||
      typeof manifest.images !== "object" ||
      Array.isArray(manifest.images)
    ) {
      throw new Error("Invalid R2 manifest");
    }

    return {
      manifest,
      etag: response.ETag,
    };
  } catch {
    throw new Error("Cannot read existing R2 manifest; backup stopped");
  }
}

async function readR2Image(key: string): Promise<Buffer | null> {
  try {
    const response = await r2.send(
      new GetObjectCommand({
        Bucket: r2Bucket,
        Key: key,
      }),
    );

    if (!response.Body) {
      throw new Error("R2 image response is empty");
    }

    return Buffer.from(await response.Body.transformToByteArray());
  } catch (error) {
    if (getErrorStatus(error) === 404) {
      return null;
    }

    throw new Error("Cannot read R2 image");
  }
}

export async function backupCloudinaryImagesToR2(): Promise<boolean> {
  const { manifest, etag: initialEtag } = await readManifest();

  let manifestEtag = initialEtag;

  const images = await prisma.cloudinaryImage.findMany({
    where: {
      status: {
        in: [
          CloudinaryImageStatus.ATTACHED,
          CloudinaryImageStatus.PENDING_DELETE,
        ],
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  let uploaded = 0;
  let recovered = 0;
  let skipped = 0;
  let failed = 0;

  console.log(`Images to check: ${images.length}`);

  for (const image of images) {
    try {
      const existing = manifest.images[image.publicId];

      if (existing) {
        if (!(await hasVerifiedR2Backup(image.publicId))) {
          throw new Error(
            "Existing backup verification failed; manual review required",
          );
        }

        skipped++;
        console.log(`SKIP ${image.publicId}`);
        continue;
      }

      const resource = await findResource(image.publicId);

      const format = resource.format as string | undefined;

      if (!format || !/^[a-zA-Z0-9]+$/.test(format)) {
        throw new Error("Invalid Cloudinary resource format");
      }

      const filename = `${image.id}.${format}`;
      const imageKey = `cloudinary/images/${filename}`;

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

      if (!response.ok) {
        throw new Error(`Cloudinary download failed (HTTP ${response.status})`);
      }

      const content = Buffer.from(await response.arrayBuffer());

      if (
        content.length === 0 ||
        (typeof resource.bytes === "number" &&
          content.length !== resource.bytes)
      ) {
        throw new Error("Cloudinary download size mismatch");
      }

      const sha256 = createHash("sha256").update(content).digest("hex");

      const existingR2Content = await readR2Image(imageKey);

      let wasRecovered = false;

      if (existingR2Content !== null) {
        const existingHash = createHash("sha256")
          .update(existingR2Content)
          .digest("hex");

        if (
          existingR2Content.length !== content.length ||
          existingHash !== sha256
        ) {
          throw new Error(
            "Existing R2 object checksum mismatch; manual review required",
          );
        }

        wasRecovered = true;
      } else {
        try {
          await r2.send(
            new PutObjectCommand({
              Bucket: r2Bucket,
              Key: imageKey,
              Body: content,
              IfNoneMatch: "*",
            }),
          );
        } catch (error) {
          if (getErrorStatus(error) === 409 || getErrorStatus(error) === 412) {
            throw new Error(
              "R2 image was created concurrently; retry required",
            );
          }

          throw error;
        }
      }

      const stored = await readR2Image(imageKey);

      if (
        !stored ||
        stored.length !== content.length ||
        createHash("sha256").update(stored).digest("hex") !== sha256
      ) {
        throw new Error("R2 checksum verification failed");
      }

      const newEntry: BackupEntry = {
        publicId: image.publicId,
        resourceType: image.resourceType,
        status: image.status,
        cloudinaryType: resource.type,
        format,
        filename,
        size: content.length,
        sha256,
        backedUpAt: new Date().toISOString(),
      };

      const updatedManifest: BackupManifest = {
        ...manifest,
        images: {
          ...manifest.images,
          [image.publicId]: newEntry,
        },
      };

      let manifestResponse;

      try {
        manifestResponse = await r2.send(
          new PutObjectCommand({
            Bucket: r2Bucket,
            Key: manifestKey,
            Body: JSON.stringify(updatedManifest, null, 2),
            ContentType: "application/json",
            IfMatch: manifestEtag,
          }),
        );
      } catch (error) {
        if (getErrorStatus(error) === 409 || getErrorStatus(error) === 412) {
          throw new Error("R2 manifest conflict; backup stopped");
        }

        throw new Error("R2 manifest update failed; backup stopped");
      }

      if (!manifestResponse.ETag) {
        throw new Error("R2 manifest update returned no ETag");
      }

      manifestEtag = manifestResponse.ETag;
      manifest.images[image.publicId] = newEntry;

      if (!(await hasVerifiedR2Backup(image.publicId))) {
        throw new Error("Final R2 backup verification failed");
      }

      if (wasRecovered) {
        recovered++;
        console.log(`RECOVERED ${image.publicId}`);
      } else {
        uploaded++;
        console.log(`OK ${image.publicId}`);
      }
    } catch (error) {
      failed++;

      const message =
        error instanceof Error ? error.message : "Unknown backup error";

      console.error(`FAIL ${image.publicId}: ${message}`);

      if (
        message.includes("manifest conflict") ||
        message.includes("manifest update failed") ||
        message.includes("no ETag") ||
        message.includes("Final R2 backup verification failed")
      ) {
        console.error("Stopping backup to protect manifest consistency");
        break;
      }
    }
  }

  console.log("\nR2 backup summary:");
  console.log(`Uploaded: ${uploaded}`);
  console.log(`Recovered: ${recovered}`);
  console.log(`Already verified: ${skipped}`);
  console.log(`Failed: ${failed}`);

return failed === 0;
}

