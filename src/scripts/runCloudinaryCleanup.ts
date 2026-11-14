import "dotenv/config";

import { Client } from "pg";

import r2 from "../libs/r2";
import prisma from "../prisma";
import {
  getStaleCloudinaryDeletions,
  recoverStaleCloudinaryDeletion,
  runCloudinaryCleanup,
  scheduleAbandonedTemporaryImages,
} from "../services/cloudinaryCleanup.service";
import { backupCloudinaryImagesToR2 } from "./backupCloudinaryImagesToR2";

const LOCK_ID = 20461114;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing");
  }

  const client = new Client({
    connectionString: databaseUrl,
  });

  let connected = false;
  let lockAcquired = false;
  let lockConnectionLost = false;

  client.on("error", () => {
    lockConnectionLost = true;
    console.error("Maintenance lock connection lost");
  });

  client.on("end", () => {
    lockConnectionLost = true;
  });

  const assertLockActive = async () => {
    if (!lockAcquired || lockConnectionLost) {
      throw new Error("Maintenance lock is no longer active");
    }

    await client.query("SELECT 1");

    if (lockConnectionLost) {
      throw new Error("Maintenance lock connection lost");
    }
  };

  try {
    await client.connect();
    connected = true;

    const result = await client.query<{ acquired: boolean }>(
      "SELECT pg_try_advisory_lock($1) AS acquired",
      [LOCK_ID],
    );

    lockAcquired = result.rows[0]?.acquired === true;

    if (!lockAcquired) {
      console.log("Cloudinary maintenance already running; skipping");
      return;
    }

    console.log("Cloudinary maintenance started");

    console.log("\nRecovering stale Cloudinary deletions");

    await assertLockActive();

    const staleImages = await getStaleCloudinaryDeletions(50);

    for (const image of staleImages) {
      await assertLockActive();

      const result = await recoverStaleCloudinaryDeletion(image.id);

      console.log(`RECOVERY ${image.publicId}: ${result}`);
    }

    console.log("\nStep 0: Schedule abandoned temporary images");

    await assertLockActive();

    const temporarySummary = await scheduleAbandonedTemporaryImages(24);

    console.log("Temporary summary:", temporarySummary);

    console.log("\nStep 1: R2 backup");

    const backupSuccessful = await backupCloudinaryImagesToR2();

    if (!backupSuccessful) {
      throw new Error("R2 backup failed; Cloudinary cleanup skipped");
    }

    await assertLockActive();

    console.log("\nStep 2: Cloudinary cleanup");

    const summary = await runCloudinaryCleanup(50, false, assertLockActive);

    console.log("\nCleanup summary:");
    console.log(summary);

    console.log("\nCloudinary maintenance finished");
  } finally {
    if (connected) {
      if (lockAcquired && !lockConnectionLost) {
        try {
          await client.query("SELECT pg_advisory_unlock($1)", [LOCK_ID]);
        } catch {
          console.error("Failed to release maintenance lock");
        }
      }

      try {
        await client.end();
      } catch {
        console.error("Failed to close maintenance connection");
      }
    }
  }
}

main()
  .catch(() => {
    console.error("Cloudinary maintenance failed");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    r2.destroy();
  });
