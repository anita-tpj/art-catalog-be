
import { createHash } from "node:crypto";
import { GetObjectCommand } from "@aws-sdk/client-s3";

import r2, { r2Bucket } from "../libs/r2";

type BackupEntry = {
  filename: string;
  size: number;
  sha256: string;
};

export async function hasVerifiedR2Backup(
  publicId: string,
): Promise<boolean> {
  try {
    // 1. Read backup manifest
    const manifestResponse = await r2.send(
      new GetObjectCommand({
        Bucket: r2Bucket,
        Key: "cloudinary/manifest.json",
      }),
    );

    if (!manifestResponse.Body) return false;

    const manifest = JSON.parse(
      await manifestResponse.Body.transformToString(),
    );

    if (
      manifest.version !== 1 ||
      !manifest.images ||
      typeof manifest.images !== "object" ||
      Array.isArray(manifest.images)
    ) {
      return false;
    }

    // 2. Find image in manifest
    const entry: BackupEntry | undefined =
      manifest.images[publicId];

    if (
      !entry ||
      typeof entry.filename !== "string" ||
      !/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(entry.filename) ||
      !Number.isSafeInteger(entry.size) ||
      entry.size < 0 ||
      typeof entry.sha256 !== "string" ||
      !/^[a-fA-F0-9]{64}$/.test(entry.sha256)
    ) {
      return false;
    }

    // 3. Download backup image
    const imageResponse = await r2.send(
      new GetObjectCommand({
        Bucket: r2Bucket,
        Key: `cloudinary/images/${entry.filename}`,
      }),
    );

    if (!imageResponse.Body) return false;

    const content = Buffer.from(
      await imageResponse.Body.transformToByteArray(),
    );

    // 4. Verify size and SHA-256
    const actualHash = createHash("sha256")
      .update(content)
      .digest("hex");

    return (
      content.length === entry.size &&
      actualHash === entry.sha256.toLowerCase()
    );
  } catch {
    // Any R2 error must block Cloudinary deletion
    return false;
  }
}
