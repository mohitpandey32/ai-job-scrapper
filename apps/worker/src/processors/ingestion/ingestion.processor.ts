import type { Job } from "bullmq";
import { prisma } from "@ai-job-platform/database";
import { runIngestionOnce } from "@ai-job-platform/ingestion";
import type { AppLogger } from "@ai-job-platform/logger";

export interface IngestionJobData {
  readonly sourceUrl: string;
}

export async function processIngestionJob(job: Job<IngestionJobData>, logger: AppLogger) {
  logger.info({ jobId: job.id, sourceUrl: job.data.sourceUrl }, "Starting ingestion queue job");
  await runIngestionOnce(prisma, logger);
}
