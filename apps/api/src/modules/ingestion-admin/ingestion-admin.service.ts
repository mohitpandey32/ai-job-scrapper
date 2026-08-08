import type { PrismaClient } from "@ai-job-platform/database";
import { runIngestionOnce, type IngestionRunSummary } from "@ai-job-platform/ingestion";
import type { AppLogger } from "@ai-job-platform/logger";
import { AppError } from "../../common/errors/app-error";

export class IngestionAdminService {
  private activeRun: Promise<IngestionRunSummary> | undefined;

  constructor(
    private readonly db: PrismaClient,
    private readonly logger: AppLogger,
  ) {}

  async runNow() {
    if (this.activeRun) {
      throw new AppError(409, "An ingestion run is already in progress.", "INGESTION_ALREADY_RUNNING");
    }

    const startedAt = new Date();
    this.activeRun = runIngestionOnce(this.db, this.logger.child({ module: "manual-ingestion" }));

    try {
      const summary = await this.activeRun;
      return {
        summary,
        startedAt: startedAt.toISOString(),
        finishedAt: new Date().toISOString(),
      };
    } finally {
      this.activeRun = undefined;
    }
  }
}
