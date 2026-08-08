import { Worker } from "bullmq";
import IORedis from "ioredis";
import { loadConfig } from "@ai-job-platform/config";
import { prisma } from "@ai-job-platform/database";
import { createLogger } from "@ai-job-platform/logger";
import { queueNames } from "./queues/queue-names";
import { processIngestionJob } from "./processors/ingestion/ingestion.processor";

const config = loadConfig();
const logger = createLogger("worker");
const connection = new IORedis(config.redisUrl, {
  maxRetriesPerRequest: null,
});

const ingestionWorker = new Worker(
  queueNames.ingestion,
  async (job) => {
    await processIngestionJob(job, logger);
  },
  {
    connection,
    concurrency: 5,
  },
);

ingestionWorker.on("completed", (job) => {
  logger.info({ jobId: job.id, queue: queueNames.ingestion }, "Worker job completed");
});

ingestionWorker.on("failed", (job, error) => {
  logger.error({ jobId: job?.id, queue: queueNames.ingestion, error }, "Worker job failed");
});

async function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down worker");
  await ingestionWorker.close();
  await connection.quit();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

