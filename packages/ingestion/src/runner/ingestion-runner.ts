import { createHash } from "node:crypto";
import type { Prisma, PrismaClient } from "@ai-job-platform/database";
import type { AppLogger } from "@ai-job-platform/logger";
import { AshbyAdapter } from "../adapters/ashby/ashby-adapter";
import { GreenhouseAdapter } from "../adapters/greenhouse/greenhouse-adapter";
import { LeverAdapter } from "../adapters/lever/lever-adapter";
import { createDeduplicationFingerprint } from "../deduplication/deduplication";
import { normalizeJob } from "../normalizer/normalize-job";
import { evaluateSourcePolicy } from "../source-policy/source-policy";
import type {
  JobSourceAdapter,
  NormalizedJobPosting,
  RawJobPosting,
  SourceConfig,
} from "../types";
import { validateJobUrls, type JobUrlValidationResult } from "../validation/job-url-validator";

const adapters: JobSourceAdapter[] = [new GreenhouseAdapter(), new LeverAdapter(), new AshbyAdapter()];
const urlValidationConcurrency = 8;
const defaultStaleJobExpiryDays = 14;

export interface IngestionRunOptions {
  readonly staleJobExpiryDays?: number;
}

export interface IngestionRunSummary {
  readonly sourcesChecked: number;
  readonly sourcesIngested: number;
  readonly jobsFetched: number;
  readonly jobsCreated: number;
  readonly jobsUpdated: number;
  readonly jobsExpired: number;
  readonly jobsSkipped: number;
  readonly invalidUrlsSkipped: number;
  readonly duplicatesDetected: number;
  readonly failures: number;
}

export async function runIngestionOnce(
  db: PrismaClient,
  logger: AppLogger,
  options: IngestionRunOptions = {},
): Promise<IngestionRunSummary> {
  const staleJobExpiryDays = options.staleJobExpiryDays ?? defaultStaleJobExpiryDays;
  const now = new Date();
  const staleCutoff = subtractDays(now, staleJobExpiryDays);
  const sources = await db.jobSource.findMany({
    where: {
      status: "ACTIVE",
      sourcePolicy: {
        allowed: true,
      },
    },
    include: {
      company: true,
      sourcePolicy: true,
    },
    orderBy: {
      lastCrawledAt: "asc",
    },
  });

  const summary = {
    sourcesChecked: sources.length,
    sourcesIngested: 0,
    jobsFetched: 0,
    jobsCreated: 0,
    jobsUpdated: 0,
    jobsExpired: 0,
    jobsSkipped: 0,
    invalidUrlsSkipped: 0,
    duplicatesDetected: 0,
    failures: 0,
  };

  for (const source of sources) {
    const run = await db.ingestionRun.create({
      data: {
        sourceId: source.id,
        status: "RUNNING",
        startedAt: new Date(),
      },
    });

    try {
      const sourceConfig = toSourceConfig(source);
      const policy = evaluateSourcePolicy(sourceConfig);

      if (!policy.allowed) {
        await markRunFailed(db, run.id, source.id, policy.reason, false);
        summary.failures += 1;
        continue;
      }

      const adapter = adapters.find((candidate) => candidate.canHandle(sourceConfig));

      if (!adapter) {
        await markRunFailed(db, run.id, source.id, `No adapter for source type ${source.sourceType}`, false);
        summary.failures += 1;
        continue;
      }

      const startedAt = Date.now();
      const rawJobs = await adapter.fetchJobs(sourceConfig);
      const filteredJobs = rawJobs.filter(isIndiaRelevant);
      const persisted = await persistJobs(db, source.id, source.companyId, filteredJobs.map(normalizeJob));
      const expired = await expireStaleJobsForSuccessfulSource(db, source.id, staleCutoff, now);

      await db.ingestionRun.update({
        where: { id: run.id },
        data: {
          status: "SUCCEEDED",
          finishedAt: new Date(),
          durationMs: Date.now() - startedAt,
          jobsFetched: rawJobs.length,
          jobsCreated: persisted.created,
          jobsUpdated: persisted.updated,
          jobsExpired: expired,
          duplicatesDetected: persisted.duplicates,
          metadata: {
            skippedNonIndiaRelevant: rawJobs.length - filteredJobs.length,
            skippedInvalidUrls: persisted.invalidUrlsSkipped,
            staleJobExpiryDays,
            staleCutoff: staleCutoff.toISOString(),
          },
        },
      });

      await db.jobSource.update({
        where: { id: source.id },
        data: {
          lastCrawledAt: new Date(),
          lastSuccessAt: new Date(),
          failureCount: 0,
        },
      });

      summary.sourcesIngested += 1;
      summary.jobsFetched += rawJobs.length;
      summary.jobsCreated += persisted.created;
      summary.jobsUpdated += persisted.updated;
      summary.jobsExpired += expired;
      summary.jobsSkipped += rawJobs.length - filteredJobs.length + persisted.invalidUrlsSkipped;
      summary.invalidUrlsSkipped += persisted.invalidUrlsSkipped;
      summary.duplicatesDetected += persisted.duplicates;

      logger.info({ sourceUrl: source.sourceUrl, ...persisted, expired }, "Ingestion source completed");
    } catch (error) {
      summary.failures += 1;
      logger.error({ sourceUrl: source.sourceUrl, error }, "Ingestion source failed");
      await markRunFailed(db, run.id, source.id, error instanceof Error ? error.message : "Unknown ingestion failure", true);
    }
  }

  return summary;
}

type SourceWithRelations = Prisma.JobSourceGetPayload<{
  include: {
    company: true;
    sourcePolicy: true;
  };
}>;

function toSourceConfig(source: SourceWithRelations): SourceConfig {
  return {
    name: source.company?.name ?? source.sourceUrl,
    sourceType: source.sourceType,
    sourceUrl: source.sourceUrl,
    country: "India",
    riskLevel: source.sourcePolicy?.riskLevel ?? source.riskLevel,
    termsReviewStatus: source.sourcePolicy?.termsReviewStatus ?? source.termsReviewStatus,
    crawlFrequencyMinutes: source.crawlFrequencyMinutes,
    allowed: Boolean(source.sourcePolicy?.allowed),
    notes: source.sourcePolicy?.blockedReason ?? undefined,
  };
}

async function persistJobs(
  db: PrismaClient,
  sourceId: string,
  fallbackCompanyId: string | null,
  jobs: NormalizedJobPosting[],
) {
  const summary = {
    created: 0,
    updated: 0,
    duplicates: 0,
    invalidUrlsSkipped: 0,
  };

  const validatedJobs = await mapWithConcurrency<NormalizedJobPosting, ValidatedJob>(
    jobs,
    urlValidationConcurrency,
    async (job) => {
      const fingerprint = createDeduplicationFingerprint(job);
      const contentHash = sha256(fingerprint.contentKey);
      const canonicalUrl = fingerprint.canonicalUrl ?? fingerprint.applyUrl;
      const urlValidation = await validateJobUrls(canonicalUrl, job.applyUrl);

      return {
        job,
        canonicalUrl,
        contentHash,
        urlValidation,
      };
    },
  );

  for (const validatedJob of validatedJobs) {
    if (!validatedJob.urlValidation.valid) {
      summary.invalidUrlsSkipped += 1;
      continue;
    }

    const job = validatedJob.job;
    const companyId = fallbackCompanyId ?? (await upsertCompany(db, job.companyName)).id;
    const canonicalUrl = validatedJob.canonicalUrl;
    const contentHash = validatedJob.contentHash;

    const duplicate = await db.job.findFirst({
      where: {
        OR: [
          { canonicalUrl },
          { contentHash },
          job.externalJobId ? { sourceId, externalJobId: job.externalJobId } : undefined,
        ].filter(Boolean) as Prisma.JobWhereInput[],
      },
    });

    if (duplicate && duplicate.sourceId !== sourceId && duplicate.canonicalUrl !== canonicalUrl) {
      summary.duplicates += 1;
    }

    const existing = await db.job.findFirst({
      where: {
        OR: [
          { canonicalUrl },
          job.externalJobId ? { sourceId, externalJobId: job.externalJobId } : undefined,
        ].filter(Boolean) as Prisma.JobWhereInput[],
      },
    });

    const data = {
      companyId,
      sourceId,
      externalJobId: job.externalJobId,
      canonicalUrl,
      applyUrl: job.applyUrl,
      title: job.title,
      normalizedTitle: job.normalizedTitle,
      description: job.description || "No description available.",
      employmentType: job.employmentType,
      experienceLevel: job.experienceLevel,
      minExperience: job.minExperience,
      maxExperience: job.maxExperience,
      locationCity: job.locationCity,
      locationState: job.locationState,
      country: "India",
      isRemote: job.isRemote,
      isHybrid: job.isHybrid,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryCurrency: job.salaryCurrency ?? "INR",
      postedAt: job.postedAt ? new Date(job.postedAt) : undefined,
      lastSeenAt: new Date(),
      status: "ACTIVE" as const,
      expiresAt: null,
      contentHash,
      metadata: {
        ...job.metadata,
        ingested: true,
        urlValidation: validatedJob.urlValidation as unknown as Prisma.InputJsonValue,
      },
    };

    if (existing) {
      await db.job.update({
        where: { id: existing.id },
        data,
      });
      summary.updated += 1;
    } else {
      await db.job.create({
        data: {
          ...data,
          firstSeenAt: new Date(),
        },
      });
      summary.created += 1;
    }
  }

  return summary;
}

async function expireStaleJobsForSuccessfulSource(
  db: PrismaClient,
  sourceId: string,
  staleCutoff: Date,
  expiredAt: Date,
) {
  const result = await db.job.updateMany({
    where: {
      sourceId,
      status: "ACTIVE",
      lastSeenAt: {
        lt: staleCutoff,
      },
    },
    data: {
      status: "EXPIRED",
      expiresAt: expiredAt,
    },
  });

  return result.count;
}

interface ValidatedJob {
  readonly job: NormalizedJobPosting;
  readonly canonicalUrl: string;
  readonly contentHash: string;
  readonly urlValidation: JobUrlValidationResult;
}

async function upsertCompany(db: PrismaClient, companyName: string) {
  return db.company.upsert({
    where: { slug: slugify(companyName) },
    create: {
      name: companyName,
      slug: slugify(companyName),
    },
    update: {
      name: companyName,
    },
  });
}

async function mapWithConcurrency<TInput, TOutput>(
  items: readonly TInput[],
  concurrency: number,
  mapper: (item: TInput) => Promise<TOutput>,
): Promise<TOutput[]> {
  const results = new Array<TOutput>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      const item = items[currentIndex];

      if (item !== undefined) {
        results[currentIndex] = await mapper(item);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));

  return results;
}

async function markRunFailed(db: PrismaClient, runId: string, sourceId: string, message: string, retryable: boolean) {
  await db.ingestionRun.update({
    where: { id: runId },
    data: {
      status: "FAILED",
      finishedAt: new Date(),
      fetchFailures: 1,
    },
  });

  await db.ingestionError.create({
    data: {
      ingestionRunId: runId,
      severity: "ERROR",
      code: "INGESTION_FAILED",
      message,
      retryable,
    },
  });

  await db.jobSource.update({
    where: { id: sourceId },
    data: {
      lastCrawledAt: new Date(),
      failureCount: {
        increment: 1,
      },
    },
  });
}

function isIndiaRelevant(job: RawJobPosting): boolean {
  const haystack = [
    job.title,
    job.location,
    job.description,
    job.metadata ? JSON.stringify(job.metadata) : "",
  ]
    .join(" ")
    .toLowerCase();

  return [
    "india",
    "bangalore",
    "bengaluru",
    "mumbai",
    "delhi",
    "new delhi",
    "gurgaon",
    "gurugram",
    "chennai",
    "hyderabad",
    "pune",
    "remote in india",
    "remote - india",
  ].some((term) => haystack.includes(term));
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function subtractDays(value: Date, days: number): Date {
  const result = new Date(value);
  result.setUTCDate(result.getUTCDate() - days);
  return result;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
