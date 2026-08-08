import { loadConfig } from "@ai-job-platform/config";
import { prisma } from "@ai-job-platform/database";
import { runIngestionOnce } from "@ai-job-platform/ingestion";
import { createLogger } from "@ai-job-platform/logger";

loadConfig();

const logger = createLogger("ingestion-run-once");

runIngestionOnce(prisma, logger)
  .then((summary) => {
    logger.info(summary, "Ingestion run complete");
    console.log(JSON.stringify(summary, null, 2));
  })
  .catch((error) => {
    logger.error({ error }, "Ingestion run failed");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
