import "dotenv/config";

import r2 from "../libs/r2";
import { hasVerifiedR2Backup } from "../services/r2Backup.service";

async function main() {
  const existingPublicId = "artcatalog/artworks/ndiiruhwpjla4wtacr4j";

  const missingPublicId = "artcatalog/artworks/nonexistent-test-image";

  const existingResult = await hasVerifiedR2Backup(existingPublicId);
  const missingResult = await hasVerifiedR2Backup(missingPublicId);

  console.log("Existing image backup:", existingResult);
  console.log("Missing image backup:", missingResult);

  if (!existingResult || missingResult) {
    throw new Error("R2 backup verification test failed");
  }

  console.log("R2 backup verification passed!");
}

main()
  .catch(() => {
    console.error("R2 backup test failed");
    process.exitCode = 1;
  })
  .finally(() => r2.destroy());
