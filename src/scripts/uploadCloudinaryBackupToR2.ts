
import "dotenv/config";

import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

import {
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import r2, { r2Bucket } from "../libs/r2";

const backupDir = path.join(
  homedir(),
  "Backups",
  "creative-atlas",
  "cloudinary",
);

type BackupEntry = {
  filename: string;
  size: number;
  sha256: string;
};

function sha256(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

async function readR2Object(key: string): Promise<Buffer> {
  const response = await r2.send(
    new GetObjectCommand({
      Bucket: r2Bucket,
      Key: key,
    }),
  );

  if (!response.Body) {
    throw new Error(`Empty R2 response for ${key}`);
  }

  return Buffer.from(await response.Body.transformToByteArray());
}

async function main() {
  const manifestBuffer = await readFile(
    path.join(backupDir, "manifest.json"),
  );

  const manifest = JSON.parse(manifestBuffer.toString("utf8"));

  if (
    manifest.version !== 1 ||
    !manifest.images ||
    typeof manifest.images !== "object" ||
    Array.isArray(manifest.images)
  ) {
    throw new Error("Invalid backup manifest");
  }

  let uploaded = 0;
  let verified = 0;

  for (const [publicId, rawEntry] of Object.entries(manifest.images)) {
    const entry = rawEntry as BackupEntry;

    if (
      !entry ||
      typeof entry.filename !== "string" ||
      !/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(entry.filename) ||
      !Number.isSafeInteger(entry.size) ||
      entry.size < 0 ||
      typeof entry.sha256 !== "string" ||
      !/^[a-fA-F0-9]{64}$/.test(entry.sha256)
    ) {
      throw new Error(`Invalid manifest entry: ${publicId}`);
    }

    const filePath = path.join(backupDir, entry.filename);
    const fileInfo = await stat(filePath);
    const content = await readFile(filePath);

    if (
      !fileInfo.isFile() ||
      content.length !== entry.size ||
      sha256(content) !== entry.sha256.toLowerCase()
    ) {
      throw new Error(`Local backup verification failed: ${publicId}`);
    }

    const key = `cloudinary/images/${entry.filename}`;

    let existsAndVerified = false;

    try {
      const remoteContent = await readR2Object(key);
      existsAndVerified =
        remoteContent.length === entry.size &&
        sha256(remoteContent) === entry.sha256.toLowerCase();
    } catch (error) {
      const code =
        error && typeof error === "object" && "name" in error
          ? String(error.name)
          : "";

      if (code !== "NoSuchKey" && code !== "NotFound") {
        throw new Error(`R2 read failed: ${key}`);
      }
    }

    if (!existsAndVerified) {
      await r2.send(
        new PutObjectCommand({
          Bucket: r2Bucket,
          Key: key,
          Body: content,
          ContentType: "application/octet-stream",
        }),
      );

      uploaded++;
    }

    const remoteContent = await readR2Object(key);

    if (
      remoteContent.length !== entry.size ||
      sha256(remoteContent) !== entry.sha256.toLowerCase()
    ) {
      throw new Error(`R2 backup verification failed: ${key}`);
    }

    verified++;
    console.log(`VERIFIED ${publicId}`);
  }

  await r2.send(
    new PutObjectCommand({
      Bucket: r2Bucket,
      Key: "cloudinary/manifest.json",
      Body: manifestBuffer,
      ContentType: "application/json",
    }),
  );

  const remoteManifest = await readR2Object("cloudinary/manifest.json");

  if (!remoteManifest.equals(manifestBuffer)) {
    throw new Error("R2 manifest verification failed");
  }

  console.log("\nR2 backup completed!");
  console.log("Uploaded:", uploaded);
  console.log("Verified:", verified);
  console.log("Manifest: VERIFIED");
}

main()
  .catch(() => {
    console.error("R2 backup failed. Check the last reported step.");
    process.exitCode = 1;
  })
  .finally(() => r2.destroy());
