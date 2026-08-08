import type { PrismaClient } from "@ai-job-platform/database";
import type { CreateIngestionSourceInput } from "./ingestion-admin.schemas";

export class IngestionAdminRepository {
  constructor(private readonly db: PrismaClient) {}

  async createSource(input: CreateIngestionSourceInput) {
    const company = await this.db.company.upsert({
      where: { slug: input.companySlug ?? slugify(input.companyName) },
      create: {
        name: input.companyName,
        slug: input.companySlug ?? slugify(input.companyName),
        website: input.companyWebsite,
        industry: input.industry,
        headquarters: input.headquarters,
      },
      update: {
        name: input.companyName,
        website: input.companyWebsite,
        industry: input.industry,
        headquarters: input.headquarters,
      },
    });

    const source = await this.db.jobSource.upsert({
      where: { sourceUrl: input.sourceUrl },
      create: {
        companyId: company.id,
        sourceType: input.sourceType,
        sourceUrl: input.sourceUrl,
        status: "ACTIVE",
        riskLevel: "LOW",
        robotsAllowed: true,
        termsReviewStatus: "ALLOWED",
        crawlFrequencyMinutes: input.crawlFrequencyMinutes,
        metadata: {
          notes: input.notes,
          createdFrom: "admin",
        },
      },
      update: {
        companyId: company.id,
        sourceType: input.sourceType,
        status: "ACTIVE",
        riskLevel: "LOW",
        robotsAllowed: true,
        termsReviewStatus: "ALLOWED",
        crawlFrequencyMinutes: input.crawlFrequencyMinutes,
        metadata: {
          notes: input.notes,
          updatedFrom: "admin",
        },
      },
      include: {
        company: true,
        sourcePolicy: true,
      },
    });

    await this.db.sourcePolicy.upsert({
      where: { sourceId: source.id },
      create: {
        sourceId: source.id,
        allowed: true,
        riskLevel: "LOW",
        robotsAllowed: true,
        termsReviewStatus: "ALLOWED",
        requiresJavascript: false,
        allowBrowserRender: false,
        maxRequestsPerHour: input.maxRequestsPerHour,
        reviewedBy: "admin",
        reviewedAt: new Date(),
        metadata: {
          notes: input.notes,
        },
      },
      update: {
        allowed: true,
        riskLevel: "LOW",
        robotsAllowed: true,
        termsReviewStatus: "ALLOWED",
        requiresJavascript: false,
        allowBrowserRender: false,
        maxRequestsPerHour: input.maxRequestsPerHour,
        reviewedBy: "admin",
        reviewedAt: new Date(),
        metadata: {
          notes: input.notes,
        },
      },
    });

    return this.db.jobSource.findUniqueOrThrow({
      where: { id: source.id },
      include: {
        company: true,
        sourcePolicy: true,
      },
    });
  }

  listSources() {
    return this.db.jobSource.findMany({
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      include: {
        company: true,
        sourcePolicy: true,
      },
      take: 100,
    });
  }

  listRecentRuns() {
    return this.db.ingestionRun.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        source: {
          include: {
            company: true,
          },
        },
      },
      take: 100,
    });
  }

  listRecentErrors() {
    return this.db.ingestionError.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        ingestionRun: {
          include: {
            source: true,
          },
        },
      },
      take: 100,
    });
  }

  async getStats() {
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const staleRiskCutoff = subtractDays(now, 10);

    const [
      activeJobs,
      expiredJobs,
      removedJobs,
      duplicateJobs,
      activeJobsSeenToday,
      activeJobsStaleRisk,
      earlyCareerJobs,
      internshipJobs,
      strongEarlyCareerJobs,
      weakEarlyCareerJobs,
    ] =
      await this.db.$transaction([
        this.db.job.count({ where: { status: "ACTIVE", country: "India" } }),
        this.db.job.count({ where: { status: "EXPIRED", country: "India" } }),
        this.db.job.count({ where: { status: "REMOVED", country: "India" } }),
        this.db.job.count({ where: { status: "DUPLICATE", country: "India" } }),
        this.db.job.count({
          where: {
            status: "ACTIVE",
            country: "India",
            lastSeenAt: {
              gte: startOfToday,
            },
          },
        }),
        this.db.job.count({
          where: {
            status: "ACTIVE",
            country: "India",
            lastSeenAt: {
              lt: staleRiskCutoff,
            },
          },
        }),
        this.db.job.count({
          where: {
            status: "ACTIVE",
            country: "India",
            AND: [
              {
                OR: [
                  { employmentType: "INTERNSHIP" },
                  { experienceLevel: { in: ["ENTRY", "JUNIOR"] } },
                  { minExperience: { lte: 1 } },
                  { maxExperience: { lte: 2 } },
                ],
              },
              { NOT: buildSeniorTitleWhere() },
            ],
          },
        }),
        this.db.job.count({
          where: {
            status: "ACTIVE",
            country: "India",
            employmentType: "INTERNSHIP",
            NOT: buildSeniorTitleWhere(),
          },
        }),
        this.db.job.count({
          where: {
            status: "ACTIVE",
            country: "India",
            AND: [
              {
                OR: [
                  { employmentType: "INTERNSHIP" },
                  { title: { contains: "apprentice", mode: "insensitive" } },
                  { title: { contains: "fresher", mode: "insensitive" } },
                  { title: { contains: "trainee", mode: "insensitive" } },
                  { title: { contains: "new grad", mode: "insensitive" } },
                  { title: { contains: "graduate engineer", mode: "insensitive" } },
                  { title: { contains: "entry level", mode: "insensitive" } },
                  { title: { contains: "associate software engineer", mode: "insensitive" } },
                  { title: { contains: "software engineer i", mode: "insensitive" } },
                  { title: { contains: "sde i", mode: "insensitive" } },
                ],
              },
              { NOT: buildSeniorTitleWhere() },
            ],
          },
        }),
        this.db.job.count({
          where: {
            status: "ACTIVE",
            country: "India",
            OR: [
              { experienceLevel: { in: ["ENTRY", "JUNIOR"] } },
              { minExperience: { lte: 1 } },
              { maxExperience: { lte: 2 } },
            ],
            NOT: {
              OR: [
                { employmentType: "INTERNSHIP" },
                { title: { contains: "intern", mode: "insensitive" } },
                { title: { contains: "apprentice", mode: "insensitive" } },
                { title: { contains: "fresher", mode: "insensitive" } },
                { title: { contains: "trainee", mode: "insensitive" } },
                { title: { contains: "new grad", mode: "insensitive" } },
                { title: { contains: "graduate engineer", mode: "insensitive" } },
                { title: { contains: "entry level", mode: "insensitive" } },
                { title: { contains: "associate software engineer", mode: "insensitive" } },
                { title: { contains: "software engineer i", mode: "insensitive" } },
                { title: { contains: "sde i", mode: "insensitive" } },
              ],
            },
            AND: [{ NOT: buildSeniorTitleWhere() }],
          },
        }),
      ]);

    return {
      activeJobs,
      expiredJobs,
      removedJobs,
      duplicateJobs,
      activeJobsSeenToday,
      activeJobsStaleRisk,
      earlyCareerJobs,
      internshipJobs,
      strongEarlyCareerJobs,
      weakEarlyCareerJobs,
    };
  }
}

function buildSeniorTitleWhere() {
  return {
    OR: ["senior", "sr.", "staff", "principal", "lead", "manager", "architect", "director", "head"].map((term) => ({
      title: { contains: term, mode: "insensitive" as const },
    })),
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function subtractDays(value: Date, days: number): Date {
  const result = new Date(value);
  result.setUTCDate(result.getUTCDate() - days);
  return result;
}
