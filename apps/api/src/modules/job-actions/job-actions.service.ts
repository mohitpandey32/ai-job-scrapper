import { AppError } from "../../common/errors/app-error";
import type { CoverLetterPdfService } from "../cover-letters/cover-letter-pdf.service";
import type { CoverLetterGenerator } from "../cover-letters/cover-letter.types";
import type { ApplicationListQuery, CoverLetterPdfInput, UpdateApplicationInput, UpsertApplicationInput } from "./job-actions.schemas";
import type { JobActionsRepository } from "./job-actions.repository";

export class JobActionsService {
  constructor(
    private readonly repository: JobActionsRepository,
    private readonly coverLetterGenerator: CoverLetterGenerator,
    private readonly coverLetterPdfService: CoverLetterPdfService,
  ) {}

  async getJobDetail(userId: string, jobId: string) {
    const job = await this.repository.getJobDetail(userId, jobId);
    return serializeJobDetail(job);
  }

  async saveJob(userId: string, jobId: string) {
    await this.repository.saveJob(userId, jobId);
    return { saved: true };
  }

  async unsaveJob(userId: string, jobId: string) {
    await this.repository.unsaveJob(userId, jobId);
    return { saved: false };
  }

  async listSavedJobs(userId: string) {
    const savedJobs = await this.repository.listSavedJobs(userId);
    return {
      items: savedJobs.map((savedJob) => ({
        id: savedJob.id,
        createdAt: savedJob.createdAt,
        job: serializeJobListItem(savedJob.job),
      })),
    };
  }

  async upsertApplication(userId: string, input: UpsertApplicationInput) {
    const application = await this.repository.upsertApplication(userId, input);
    return serializeApplication(application);
  }

  async listApplications(userId: string, query: ApplicationListQuery) {
    const applications = await this.repository.listApplications(userId, query);
    return {
      items: applications.map(serializeApplication),
    };
  }

  async updateApplication(userId: string, id: string, input: UpdateApplicationInput) {
    const application = await this.repository.updateApplication(userId, id, input);
    return serializeApplication(application);
  }

  async generateCoverLetter(userId: string, jobId: string) {
    const context = await this.repository.getCoverLetterContext(userId, jobId);

    if (!context.resumeAnalysis) {
      throw new AppError(409, "Upload and analyze your resume before generating a cover letter.", "RESUME_ANALYSIS_REQUIRED");
    }

    const metadata = isRecord(context.resumeAnalysis.parsedJson) ? context.resumeAnalysis.parsedJson : {};
    const result = await this.coverLetterGenerator.generateCoverLetter({
      candidate: {
        summary: context.resumeAnalysis.experienceSummary,
        skills: getStringArray(context.resumeAnalysis.skills),
        strengths: getStringArray(context.resumeAnalysis.strengths),
        targetRoles: getStringArray(metadata.targetRoles),
      },
      job: {
        title: context.job.title,
        companyName: context.job.company.name,
        location: [context.job.locationCity, context.job.locationState, context.job.country].filter(Boolean).join(", "),
        description: context.job.description,
        skills: context.job.jobSkills.map((jobSkill) => jobSkill.skill.name),
      },
    });

    return {
      subjectLine: result.subjectLine,
      coverLetter: result.coverLetter,
      modelProvider: result.modelProvider,
      modelName: result.modelName,
      fallbackUsed: result.fallbackUsed ?? false,
      generatedAt: new Date(),
    };
  }

  async generateCoverLetterPdf(userId: string, jobId: string, input: CoverLetterPdfInput) {
    const context = await this.repository.getCoverLetterContext(userId, jobId);

    if (!context.user) {
      throw new AppError(404, "User not found.", "USER_NOT_FOUND");
    }

    const buffer = await this.coverLetterPdfService.generate({
      subjectLine: input.subjectLine,
      coverLetter: input.coverLetter,
      candidateName: context.user.profile?.fullName,
      candidateEmail: context.user.email,
      companyName: context.job.company.name,
      jobTitle: context.job.title,
      location: [context.job.locationCity, context.job.locationState, context.job.country].filter(Boolean).join(", "),
    });

    return {
      buffer,
      fileName: buildPdfFileName(context.job.company.name, context.job.title),
    };
  }
}

function serializeJobDetail(job: Awaited<ReturnType<JobActionsRepository["getJobDetail"]>>) {
  return {
    ...serializeJobListItem(job),
    canonicalUrl: job.canonicalUrl,
    minExperience: job.minExperience,
    maxExperience: job.maxExperience,
    company: {
      id: job.company.id,
      name: job.company.name,
      industry: job.company.industry,
      website: job.company.website,
      headquarters: job.company.headquarters,
    },
    skills: job.jobSkills.map((jobSkill) => ({
      id: jobSkill.skill.id,
      name: jobSkill.skill.name,
      importance: jobSkill.importance,
    })),
    userState: {
      saved: job.savedJobs.length > 0,
      application: job.applications[0] ? serializeApplicationState(job.applications[0]) : null,
    },
  };
}

function serializeApplication(application: Awaited<ReturnType<JobActionsRepository["upsertApplication"]>>) {
  return {
    ...serializeApplicationState(application),
    job: serializeJobListItem(application.job),
  };
}

function serializeApplicationState(application: {
  readonly id: string;
  readonly status: string;
  readonly notes: string | null;
  readonly appliedAt: Date | null;
  readonly interviewAt: Date | null;
  readonly nextFollowUpAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}) {
  return {
    id: application.id,
    status: application.status,
    notes: application.notes,
    appliedAt: application.appliedAt,
    interviewAt: application.interviewAt,
    nextFollowUpAt: application.nextFollowUpAt,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
  };
}

function serializeJobListItem(job: {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly applyUrl: string;
  readonly canonicalUrl: string | null;
  readonly locationCity: string | null;
  readonly locationState: string | null;
  readonly country: string;
  readonly isRemote: boolean;
  readonly isHybrid: boolean;
  readonly employmentType: string;
  readonly experienceLevel: string;
  readonly salaryMin: number | null;
  readonly salaryMax: number | null;
  readonly salaryCurrency: string | null;
  readonly postedAt: Date | null;
  readonly lastSeenAt: Date;
  readonly company: {
    readonly id: string;
    readonly name: string;
    readonly industry: string | null;
    readonly website: string | null;
  };
}) {
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    applyUrl: job.canonicalUrl ?? job.applyUrl,
    locationCity: job.locationCity,
    locationState: job.locationState,
    country: job.country,
    isRemote: job.isRemote,
    isHybrid: job.isHybrid,
    employmentType: job.employmentType,
    experienceLevel: job.experienceLevel,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency,
    postedAt: job.postedAt,
    lastSeenAt: job.lastSeenAt,
    company: {
      id: job.company.id,
      name: job.company.name,
      industry: job.company.industry,
      website: job.company.website,
    },
  };
}

function getStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildPdfFileName(companyName: string, jobTitle: string) {
  const slug = `${companyName}-${jobTitle}-cover-letter`
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 90)
    .toLowerCase();

  return `${slug || "cover-letter"}.pdf`;
}
