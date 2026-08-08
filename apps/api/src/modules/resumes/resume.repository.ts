import type { Prisma, PrismaClient } from "@ai-job-platform/database";

export class ResumeRepository {
  constructor(private readonly db: PrismaClient) {}

  createResume(data: Prisma.ResumeUncheckedCreateInput) {
    return this.db.resume.create({ data });
  }

  updateResume(id: string, data: Prisma.ResumeUpdateInput) {
    return this.db.resume.update({
      where: { id },
      data,
    });
  }

  createAnalysis(data: Prisma.AiResumeAnalysisUncheckedCreateInput) {
    return this.db.aiResumeAnalysis.create({ data });
  }

  findLatestByUserId(userId: string) {
    return this.db.resume.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        uploadedAt: "desc",
      },
      include: {
        analyses: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });
  }
}
