import type { Prisma, PrismaClient } from "@ai-job-platform/database";
import { AppError } from "../../common/errors/app-error";
import type { ApplicationListQuery, UpdateApplicationInput, UpsertApplicationInput } from "./job-actions.schemas";

export class JobActionsRepository {
  constructor(private readonly db: PrismaClient) {}

  async getJobDetail(userId: string, jobId: string) {
    const job = await this.db.job.findFirst({
      where: {
        id: jobId,
        status: "ACTIVE",
      },
      include: {
        company: true,
        jobSkills: {
          include: {
            skill: true,
          },
        },
        savedJobs: {
          where: { userId },
          take: 1,
        },
        applications: {
          where: { userId },
          take: 1,
        },
      },
    });

    if (!job) {
      throw new AppError(404, "Job not found.", "JOB_NOT_FOUND");
    }

    return job;
  }

  async getCoverLetterContext(userId: string, jobId: string) {
    const [job, resumeAnalysis, user] = await this.db.$transaction([
      this.db.job.findFirst({
        where: {
          id: jobId,
          status: "ACTIVE",
        },
        include: {
          company: true,
          jobSkills: {
            include: {
              skill: true,
            },
          },
        },
      }),
      this.db.aiResumeAnalysis.findFirst({
        where: {
          userId,
          resume: {
            parseStatus: "COMPLETED",
            deletedAt: null,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      this.db.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
        },
      }),
    ]);

    if (!job) {
      throw new AppError(404, "Job not found.", "JOB_NOT_FOUND");
    }

    return {
      job,
      resumeAnalysis,
      user,
    };
  }

  saveJob(userId: string, jobId: string) {
    return this.db.savedJob.upsert({
      where: {
        userId_jobId: {
          userId,
          jobId,
        },
      },
      create: {
        userId,
        jobId,
      },
      update: {},
    });
  }

  async unsaveJob(userId: string, jobId: string) {
    await this.db.savedJob.deleteMany({
      where: {
        userId,
        jobId,
      },
    });
  }

  listSavedJobs(userId: string) {
    return this.db.savedJob.findMany({
      where: { userId },
      include: {
        job: {
          include: {
            company: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  upsertApplication(userId: string, input: UpsertApplicationInput) {
    return this.db.application.upsert({
      where: {
        userId_jobId: {
          userId,
          jobId: input.jobId,
        },
      },
      create: {
        userId,
        jobId: input.jobId,
        status: input.status,
        notes: input.notes,
        appliedAt: parseOptionalDate(input.appliedAt),
        interviewAt: parseOptionalDate(input.interviewAt),
        nextFollowUpAt: parseOptionalDate(input.nextFollowUpAt),
      },
      update: {
        status: input.status,
        notes: input.notes,
        appliedAt: parseOptionalDate(input.appliedAt),
        interviewAt: parseOptionalDate(input.interviewAt),
        nextFollowUpAt: parseOptionalDate(input.nextFollowUpAt),
      },
      include: applicationInclude,
    });
  }

  listApplications(userId: string, query: ApplicationListQuery) {
    return this.db.application.findMany({
      where: {
        userId,
        status: query.status,
      },
      include: applicationInclude,
      orderBy: [{ updatedAt: "desc" }],
    });
  }

  updateApplication(userId: string, id: string, input: UpdateApplicationInput) {
    return this.db.application.update({
      where: {
        id,
        userId,
      },
      data: {
        status: input.status,
        notes: input.notes,
        appliedAt: parseNullableDate(input.appliedAt),
        interviewAt: parseNullableDate(input.interviewAt),
        nextFollowUpAt: parseNullableDate(input.nextFollowUpAt),
      },
      include: applicationInclude,
    });
  }
}

const applicationInclude = {
  job: {
    include: {
      company: true,
    },
  },
} satisfies Prisma.ApplicationInclude;

function parseOptionalDate(value: string | undefined) {
  return value ? new Date(value) : undefined;
}

function parseNullableDate(value: string | null | undefined) {
  if (value === null) return null;
  if (value === undefined) return undefined;
  return new Date(value);
}
