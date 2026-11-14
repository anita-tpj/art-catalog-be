import { CloudinaryImageStatus } from "@prisma/client";
import { createHash, randomUUID } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import cloudinary, { deleteImage } from "../libs/cloudinary";
import prisma from "../prisma";
import { hasVerifiedR2Backup } from "./r2Backup.service";

export async function hasVerifiedCloudinaryBackup(
  publicId: string,
): Promise<boolean> {
  const backupDir = path.join(
    homedir(),
    "Backups",
    "creative-atlas",
    "cloudinary",
  );

  try {
    const manifest = JSON.parse(
      await readFile(path.join(backupDir, "manifest.json"), "utf8"),
    );

    if (manifest.version !== 1) return false;

    const entry = manifest.images?.[publicId];

    if (
      !entry ||
      typeof entry.filename !== "string" ||
      typeof entry.size !== "number" ||
      typeof entry.sha256 !== "string" ||
      !/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(entry.filename)
    ) {
      return false;
    }

    const filePath = path.join(backupDir, entry.filename);
    const fileInfo = await stat(filePath);

    if (!fileInfo.isFile() || fileInfo.size !== entry.size) {
      return false;
    }

    const content = await readFile(filePath);
    const actualHash = createHash("sha256").update(content).digest("hex");

    return actualHash === entry.sha256;
  } catch {
    return false;
  }
}

export async function getPendingCloudinaryImages(limit = 50) {
  const now = new Date();

  return prisma.cloudinaryImage.findMany({
    where: {
      status: CloudinaryImageStatus.PENDING_DELETE,
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}

export async function isCloudinaryImageInUse(
  publicId: string,
): Promise<boolean> {
  const [artist, artwork] = await Promise.all([
    prisma.artist.findFirst({
      where: { avatarPublicId: publicId },
      select: { id: true },
    }),
    prisma.artwork.findFirst({
      where: { imagePublicId: publicId },
      select: { id: true },
    }),
  ]);

  return Boolean(artist || artwork);
}

const RETRY_BASE_DELAY_MS = 5 * 60 * 1000;
const RETRY_MAX_DELAY_MS = 24 * 60 * 60 * 1000;

export async function scheduleCloudinaryDeleteRetry(
  imageId: string,
  errorMessage: string,
): Promise<void> {
  const image = await prisma.cloudinaryImage.findUnique({
    where: { id: imageId },
    select: {
      status: true,
      deleteAttempts: true,
    },
  });

  if (!image || image.status !== CloudinaryImageStatus.PENDING_DELETE) {
    return;
  }

  const attempts = image.deleteAttempts + 1;

  const delay = Math.min(
    RETRY_BASE_DELAY_MS * 2 ** Math.min(attempts - 1, 20),
    RETRY_MAX_DELAY_MS,
  );

  await prisma.cloudinaryImage.updateMany({
    where: {
      id: imageId,
      status: CloudinaryImageStatus.PENDING_DELETE,
      deleteAttempts: image.deleteAttempts,
    },
    data: {
      deleteAttempts: { increment: 1 },
      lastDeleteError: errorMessage.slice(0, 500),
      nextRetryAt: new Date(Date.now() + delay),
    },
  });
}

export async function previewCloudinaryCleanup(limit = 50) {
  const images = await getPendingCloudinaryImages(limit);

  const results = [];

  for (const image of images) {
    const inUse = await isCloudinaryImageInUse(image.publicId);

    const hasBackup = inUse ? false : await hasVerifiedR2Backup(image.publicId);

    results.push({
      id: image.id,
      publicId: image.publicId,
      status: image.status,
      deleteAttempts: image.deleteAttempts,
      action: inUse
        ? "SKIP_IN_USE"
        : hasBackup
          ? "READY_FOR_DELETE"
          : "SKIP_NO_BACKUP",
    });
  }

  return results;
}

const DELETION_LEASE_MS = 30 * 60 * 1000;

export async function claimCloudinaryImageForDeletion(
  imageId: string,
): Promise<string | null> {
  const now = new Date();
  const leaseToken = randomUUID();

  const result = await prisma.cloudinaryImage.updateMany({
    where: {
      id: imageId,
      status: CloudinaryImageStatus.PENDING_DELETE,
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
    },
    data: {
      status: CloudinaryImageStatus.DELETING,
      deletionLeaseToken: leaseToken,
      deletionLeaseExpiresAt: new Date(now.getTime() + DELETION_LEASE_MS),
    },
  });

  return result.count === 1 ? leaseToken : null;
}

export async function getStaleCloudinaryDeletions(limit = 50) {
  const now = new Date();

  return prisma.cloudinaryImage.findMany({
    where: {
      status: CloudinaryImageStatus.DELETING,
      deletionLeaseExpiresAt: { lte: now },
    },
    orderBy: { deletionLeaseExpiresAt: "asc" },
    take: limit,
  });
}

type CloudinaryResourceState = "EXISTS" | "NOT_FOUND" | "UNKNOWN";

export async function getCloudinaryResourceState(
  publicId: string,
): Promise<CloudinaryResourceState> {
  for (const type of ["private", "upload"] as const) {
    try {
      await cloudinary.api.resource(publicId, {
        resource_type: "image",
        type,
      });

      return "EXISTS";
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

      // Never log raw Cloudinary errors:
      // they may contain API credentials.
      return "UNKNOWN";
    }
  }

  return "NOT_FOUND";
}

export async function previewStaleCloudinaryDeletions(limit = 50) {
  const images = await getStaleCloudinaryDeletions(limit);

  const results = [];

  for (const image of images) {
    const inUse = await isCloudinaryImageInUse(image.publicId);

    if (inUse) {
      results.push({
        id: image.id,
        publicId: image.publicId,
        resourceState: "NOT_CHECKED",
        action: "REVIEW_IN_USE",
      });

      continue;
    }

    const resourceState = await getCloudinaryResourceState(image.publicId);

    results.push({
      id: image.id,
      publicId: image.publicId,
      resourceState,
      action:
        resourceState === "EXISTS"
          ? "RETRY_CANDIDATE"
          : resourceState === "NOT_FOUND"
            ? "DELETED_CANDIDATE"
            : "REVIEW_UNKNOWN",
    });
  }

  return results;
}

export async function recoverStaleCloudinaryDeletion(imageId: string) {
  const now = new Date();

  const image = await prisma.cloudinaryImage.findFirst({
    where: {
      id: imageId,
      status: CloudinaryImageStatus.DELETING,
      deletionLeaseExpiresAt: { lte: now },
    },
  });

  if (!image) return "NOT_STALE";

  if (await isCloudinaryImageInUse(image.publicId)) {
    return "REVIEW_IN_USE";
  }

  const resourceState = await getCloudinaryResourceState(image.publicId);

  if (resourceState === "UNKNOWN") {
    return "REVIEW_UNKNOWN";
  }

  const result = await prisma.cloudinaryImage.updateMany({
    where: {
      id: image.id,
      status: CloudinaryImageStatus.DELETING,
      deletionLeaseToken: image.deletionLeaseToken,
      deletionLeaseExpiresAt: {
        equals: image.deletionLeaseExpiresAt,
        lte: new Date(),
      },
    },
    data:
      resourceState === "EXISTS"
        ? {
            status: CloudinaryImageStatus.PENDING_DELETE,
            deletionLeaseToken: null,
            deletionLeaseExpiresAt: null,
            nextRetryAt: new Date(Date.now() + 5 * 60 * 1000),
            lastDeleteError: "Recovered from expired deletion lease",
          }
        : {
            status: CloudinaryImageStatus.DELETED,
            deletionLeaseToken: null,
            deletionLeaseExpiresAt: null,
            nextRetryAt: null,
            lastDeleteError: null,
          },
  });

  if (result.count !== 1) {
    return "STATE_CHANGED";
  }

  return resourceState === "EXISTS" ? "REQUEUED" : "MARKED_DELETED";
}



export async function runCloudinaryCleanup(
  limit = 50,
  dryRun = true,
  assertMaintenanceActive?: () => Promise<void>,
) {
  if (!dryRun && !assertMaintenanceActive) {
    throw new Error("Maintenance lock verification is required");
  }

  const images = await getPendingCloudinaryImages(limit);

  const summary = {
    inspected: images.length,
    ready: 0,
    deleted: 0,
    failed: 0,
    skippedInUse: 0,
    skippedNoBackup: 0,
    skippedClaim: 0,
  };

  for (const image of images) {
    await assertMaintenanceActive?.();

    if (await isCloudinaryImageInUse(image.publicId)) {
      summary.skippedInUse++;
      continue;
    }

    if (!(await hasVerifiedR2Backup(image.publicId))) {
      summary.skippedNoBackup++;
      continue;
    }

    summary.ready++;

    if (dryRun) {
      console.log(`READY_FOR_DELETE ${image.publicId}`);
      continue;
    }

    await assertMaintenanceActive?.();

    const leaseToken = await claimCloudinaryImageForDeletion(
      image.id,
    );

    if (!leaseToken) {
      summary.skippedClaim++;
      continue;
    }

    try {
      // Recheck all safety conditions after claiming.
      await assertMaintenanceActive!();

      if (await isCloudinaryImageInUse(image.publicId)) {
        await failCloudinaryImageDeletion(
          image.id,
          leaseToken,
          "IMAGE_IN_USE",
        );

        summary.skippedInUse++;
        continue;
      }

      if (!(await hasVerifiedR2Backup(image.publicId))) {
        await failCloudinaryImageDeletion(
          image.id,
          leaseToken,
          "R2_BACKUP_NOT_VERIFIED",
        );

        summary.skippedNoBackup++;
        continue;
      }

      if (
        !(await hasActiveCloudinaryDeletionLease(
          image.id,
          leaseToken,
        ))
      ) {
        throw new Error("DELETION_LEASE_EXPIRED");
      }

      await assertMaintenanceActive!();

      const result = await deleteImage(image.publicId);

      if (result.result !== "ok") {
        // An ambiguous response must be verified.
        const state = await getCloudinaryResourceState(
          image.publicId,
        );

        if (state !== "NOT_FOUND") {
          throw new Error("CLOUDINARY_DELETE_NOT_CONFIRMED");
        }
      }

      const completed = await completeCloudinaryImageDeletion(
        image.id,
        leaseToken,
      );

      if (!completed) {
        throw new Error("DELETION_STATE_UPDATE_FAILED");
      }

      summary.deleted++;
      console.log(`DELETED ${image.publicId}`);
    } catch (error) {
      summary.failed++;

      const safeError = getSafeCloudinaryDeleteError(error);

      const retryScheduled = await failCloudinaryImageDeletion(
        image.id,
        leaseToken,
        safeError,
      );

      console.error(
        `DELETE_FAILED ${image.publicId}: ${safeError}` +
          (retryScheduled ? " (retry scheduled)" : " (recovery required)"),
      );
    }
  }

  return summary;
}



export async function completeCloudinaryImageDeletion(
  imageId: string,
  leaseToken: string,
): Promise<boolean> {
  const now = new Date();

  const result = await prisma.cloudinaryImage.updateMany({
    where: {
      id: imageId,
      status: CloudinaryImageStatus.DELETING,
      deletionLeaseToken: leaseToken,
      deletionLeaseExpiresAt: { gt: now },
    },
    data: {
      status: CloudinaryImageStatus.DELETED,
      deletionLeaseToken: null,
      deletionLeaseExpiresAt: null,
      nextRetryAt: null,
      lastDeleteError: null,
    },
  });

  return result.count === 1;
}

export async function failCloudinaryImageDeletion(
  imageId: string,
  leaseToken: string,
  errorMessage: string,
): Promise<boolean> {
  const image = await prisma.cloudinaryImage.findFirst({
    where: {
      id: imageId,
      status: CloudinaryImageStatus.DELETING,
      deletionLeaseToken: leaseToken,
      deletionLeaseExpiresAt: { gt: new Date() },
    },
  });

  if (!image) return false;

  const attempts = image.deleteAttempts + 1;

  const delayMinutes = Math.min(
    5 * Math.pow(2, Math.min(attempts - 1, 8)),
    24 * 60,
  );

  const now = new Date();

  const result = await prisma.cloudinaryImage.updateMany({
    where: {
      id: image.id,
      status: CloudinaryImageStatus.DELETING,
      deletionLeaseToken: leaseToken,
      deletionLeaseExpiresAt: { gt: now },
      deleteAttempts: image.deleteAttempts,
    },
    data: {
      status: CloudinaryImageStatus.PENDING_DELETE,
      deletionLeaseToken: null,
      deletionLeaseExpiresAt: null,
      deleteAttempts: attempts,
      lastDeleteError: errorMessage.slice(0, 500),
      nextRetryAt: new Date(now.getTime() + delayMinutes * 60 * 1000),
    },
  });

  return result.count === 1;
}

function getSafeCloudinaryDeleteError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "CLOUDINARY_DELETE_FAILED";
  }

  const err = error as {
    http_code?: unknown;
    error?: {
      http_code?: unknown;
    };
  };

  const httpCode = err.http_code ?? err.error?.http_code;

  switch (httpCode) {
    case 401:
      return "CLOUDINARY_AUTH_FAILED";
    case 403:
      return "CLOUDINARY_ACCESS_DENIED";
    case 404:
      return "CLOUDINARY_RESOURCE_NOT_FOUND";
    case 429:
      return "CLOUDINARY_RATE_LIMITED";
    default:
      return "CLOUDINARY_DELETE_FAILED";
  }
}

export async function hasActiveCloudinaryDeletionLease(
  imageId: string,
  leaseToken: string,
): Promise<boolean> {
  const image = await prisma.cloudinaryImage.findFirst({
    where: {
      id: imageId,
      status: CloudinaryImageStatus.DELETING,
      deletionLeaseToken: leaseToken,
      deletionLeaseExpiresAt: {
        gt: new Date(),
      },
    },
    select: { id: true },
  });

  return Boolean(image);
}


export async function scheduleAbandonedTemporaryImages(
  olderThanHours = 24,
) {
  const cutoff = new Date(
    Date.now() - olderThanHours * 60 * 60 * 1000,
  );

  const images = await prisma.cloudinaryImage.findMany({
    where: {
      status: CloudinaryImageStatus.TEMPORARY,
      createdAt: { lt: cutoff },
    },
    select: {
      id: true,
      publicId: true,
    },
  });

  let scheduled = 0;
  let skippedInUse = 0;

  for (const image of images) {
    if (await isCloudinaryImageInUse(image.publicId)) {
      skippedInUse++;
      continue;
    }

    const result = await prisma.cloudinaryImage.updateMany({
      where: {
        id: image.id,
        status: CloudinaryImageStatus.TEMPORARY,
        createdAt: { lt: cutoff },
      },
      data: {
        status: CloudinaryImageStatus.PENDING_DELETE,
        nextRetryAt: new Date(),
      },
    });

    scheduled += result.count;
  }

  console.log("Temporary image cleanup:");
  console.log(`Scheduled: ${scheduled}`);
  console.log(`Skipped in use: ${skippedInUse}`);

  return { scheduled, skippedInUse };
}
