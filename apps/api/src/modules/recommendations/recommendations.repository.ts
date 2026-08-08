import type { PrismaClient } from "@ai-job-platform/database";

export class RecommendationsRepository {
  constructor(private readonly db: PrismaClient) {}

  findLatestCompletedResumeAnalysis(userId: string) {
    return this.db.aiResumeAnalysis.findFirst({
      where: {
        userId,
        resume: {
          parseStatus: "COMPLETED",
          deletedAt: null,
        },
      },
      include: {
        resume: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  findActiveJobs(limit: number) {
    return this.db.job.findMany({
      where: {
        status: "ACTIVE",
        country: "India",
      },
      include: {
        company: true,
        jobSkills: {
          include: {
            skill: true,
          },
        },
      },
      orderBy: [{ experienceLevel: "asc" }, { minExperience: "asc" }, { lastSeenAt: "desc" }, { postedAt: "desc" }, { createdAt: "desc" }],
      take: Math.min(limit * 8, 300),
    });
  }
}
