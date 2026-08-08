import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { loadConfig } from "@ai-job-platform/config";
import { prisma } from "@ai-job-platform/database";
import { createLogger } from "@ai-job-platform/logger";
import { csrfGuard } from "./common/middleware/csrf.middleware";
import { errorHandler, notFoundHandler } from "./common/middleware/error-handler.middleware";
import { requireAdmin, requireAuth } from "./common/middleware/auth.middleware";
import { LocalStorageService } from "./common/storage/local-storage.service";
import { AuthRepository } from "./modules/auth/auth.repository";
import { createAuthRouter } from "./modules/auth/auth.routes";
import { AuthService } from "./modules/auth/auth.service";
import { PasswordService } from "./modules/auth/password.service";
import { TokenService } from "./modules/auth/token.service";
import { DeterministicCoverLetterGenerator } from "./modules/cover-letters/deterministic-cover-letter-generator";
import { FallbackCoverLetterGenerator } from "./modules/cover-letters/fallback-cover-letter-generator";
import { GeminiCoverLetterGenerator } from "./modules/cover-letters/gemini-cover-letter-generator";
import type { CoverLetterGenerator } from "./modules/cover-letters/cover-letter.types";
import { CoverLetterPdfService } from "./modules/cover-letters/cover-letter-pdf.service";
import { createHealthRouter } from "./modules/health/health.routes";
import { JobActionsRepository } from "./modules/job-actions/job-actions.repository";
import { createJobActionsRouter } from "./modules/job-actions/job-actions.routes";
import { JobActionsService } from "./modules/job-actions/job-actions.service";
import { IngestionAdminRepository } from "./modules/ingestion-admin/ingestion-admin.repository";
import { createIngestionAdminRouter } from "./modules/ingestion-admin/ingestion-admin.routes";
import { IngestionAdminService } from "./modules/ingestion-admin/ingestion-admin.service";
import { JobsRepository } from "./modules/jobs/jobs.repository";
import { createJobsRouter } from "./modules/jobs/jobs.routes";
import { ProfileRepository } from "./modules/profiles/profile.repository";
import { createProfileRouter } from "./modules/profiles/profile.routes";
import { RecommendationsRepository } from "./modules/recommendations/recommendations.repository";
import { createRecommendationsRouter } from "./modules/recommendations/recommendations.routes";
import { RecommendationsService } from "./modules/recommendations/recommendations.service";
import { DeterministicResumeAnalyzer } from "./modules/resumes/deterministic-resume-analyzer";
import { FallbackResumeAnalyzer } from "./modules/resumes/fallback-resume-analyzer";
import { GeminiResumeAnalyzer } from "./modules/resumes/gemini-resume-analyzer";
import type { ResumeAnalyzer } from "./modules/resumes/resume-ai.types";
import { ResumeRepository } from "./modules/resumes/resume.repository";
import { createResumeRouter } from "./modules/resumes/resume.routes";
import { ResumeService } from "./modules/resumes/resume.service";

export function createApp() {
  const config = loadConfig();
  const logger = createLogger("api");
  const tokenService = new TokenService(config);
  const authRepository = new AuthRepository(prisma);
  const authService = new AuthService(authRepository, new PasswordService(), tokenService);
  const profileRepository = new ProfileRepository(prisma);
  const ingestionAdminRepository = new IngestionAdminRepository(prisma);
  const ingestionAdminService = new IngestionAdminService(prisma, logger);
  const jobsRepository = new JobsRepository(prisma);
  const jobActionsRepository = new JobActionsRepository(prisma);
  const coverLetterGenerator = createCoverLetterGenerator(config, logger);
  const coverLetterPdfService = new CoverLetterPdfService();
  const jobActionsService = new JobActionsService(jobActionsRepository, coverLetterGenerator, coverLetterPdfService);
  const resumeRepository = new ResumeRepository(prisma);
  const recommendationsRepository = new RecommendationsRepository(prisma);
  const recommendationsService = new RecommendationsService(recommendationsRepository);
  const resumeStorage = new LocalStorageService({ rootDir: "uploads" });
  const resumeAnalyzer = createResumeAnalyzer(config, logger);
  const resumeService = new ResumeService(resumeRepository, resumeStorage, resumeAnalyzer);

  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(
    pinoHttp({
      logger,
      redact: ["req.headers.cookie", "req.headers.authorization"],
    }),
  );
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );
  app.use(csrfGuard);

  app.use("/health", createHealthRouter(prisma));
  app.use("/api/v1/health", createHealthRouter(prisma));
  app.use("/api/v1/auth", createAuthRouter({ authService, tokenService, config }));
  app.use("/api/v1/profiles", requireAuth(tokenService), createProfileRouter(profileRepository));
  app.use("/api/v1", requireAuth(tokenService), createJobActionsRouter(jobActionsService));
  app.use("/api/v1/jobs", requireAuth(tokenService), createJobsRouter(jobsRepository));
  app.use("/api/v1/resumes", requireAuth(tokenService), createResumeRouter(resumeService));
  app.use("/api/v1/recommendations", requireAuth(tokenService), createRecommendationsRouter(recommendationsService));
  app.use(
    "/api/v1/admin/ingestion",
    requireAuth(tokenService),
    requireAdmin,
    createIngestionAdminRouter(ingestionAdminRepository, ingestionAdminService),
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return { app, config, logger };
}

function createResumeAnalyzer(config: ReturnType<typeof loadConfig>, logger: ReturnType<typeof createLogger>): ResumeAnalyzer {
  const deterministicAnalyzer = new DeterministicResumeAnalyzer();

  if (config.aiProvider === "gemini" && config.geminiApiKey) {
    return new FallbackResumeAnalyzer(
      new GeminiResumeAnalyzer({
        apiKey: config.geminiApiKey,
        model: config.geminiModel,
      }),
      deterministicAnalyzer,
      logger,
    );
  }

  if (config.aiProvider === "gemini" && !config.geminiApiKey) {
    logger.warn("AI_PROVIDER is gemini but GEMINI_API_KEY is not configured. Using deterministic resume analyzer.");
  }

  return deterministicAnalyzer;
}

function createCoverLetterGenerator(config: ReturnType<typeof loadConfig>, logger: ReturnType<typeof createLogger>): CoverLetterGenerator {
  const deterministicGenerator = new DeterministicCoverLetterGenerator();

  if (config.aiProvider === "gemini" && config.geminiApiKey) {
    return new FallbackCoverLetterGenerator(
      new GeminiCoverLetterGenerator({
        apiKey: config.geminiApiKey,
        model: config.geminiModel,
      }),
      deterministicGenerator,
      logger,
    );
  }

  return deterministicGenerator;
}
