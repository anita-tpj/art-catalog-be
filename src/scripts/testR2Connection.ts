
import "dotenv/config";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";

import r2, { r2Bucket } from "../libs/r2";

async function main() {
  const result = await r2.send(
    new ListObjectsV2Command({
      Bucket: r2Bucket,
      MaxKeys: 1,
    }),
  );

  console.log("R2 connection successful!");
  console.log("Bucket:", r2Bucket);
  console.log("Objects found:", result.KeyCount ?? 0);
}

main()
  .catch(() => {
    console.error("R2 connection failed. Check credentials and bucket access.");
    process.exitCode = 1;
  })
  .finally(() => r2.destroy());
