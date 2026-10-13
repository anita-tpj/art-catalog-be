import logger from "../libs/logger";
import prisma from "../prisma";
import { runDataRetentionCleanup } from "../services/dataRetention.service";

async function main() {
  const dryRun = process.env.RETENTION_DRY_RUN !== "false";

  logger.info(
    `Data retention cleanup started (${dryRun ? "dry-run" : "delete"} mode)`,
  );

  const result = await runDataRetentionCleanup(dryRun);

  logger.info(`Data retention cleanup result: ${JSON.stringify(result)}`);
}

main()
  .catch((error) => {
    logger.error("Data retention cleanup failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
