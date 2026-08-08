import { AppError } from "../../common/errors/app-error";
import { skillCatalog } from "../resumes/resume-analysis";
import type { RecommendationsRepository } from "./recommendations.repository";

type ResumeAnalysis = NonNullable<Awaited<ReturnType<RecommendationsRepository["findLatestCompletedResumeAnalysis"]>>>;
type CandidateJob = Awaited<ReturnType<RecommendationsRepository["findActiveJobs"]>>[number];

export class RecommendationsService {
  constructor(private readonly repository: RecommendationsRepository) {}

  async recommendJobsForUser(userId: string, limit: number) {
    const analysis = await this.repository.findLatestCompletedResumeAnalysis(userId);

    if (!analysis) {
      throw new AppError(409, "Upload and analyze your resume before viewing recommendations.", "RESUME_ANALYSIS_REQUIRED");
    }

    const jobs = await this.repository.findActiveJobs(limit);
    const profile = buildCandidateProfile(analysis);
    const recommendations = jobs
      .map((job) => scoreJob(job, profile))
      .sort((left, right) => right.matchScore - left.matchScore || new Date(right.job.lastSeenAt).getTime() - new Date(left.job.lastSeenAt).getTime())
      .slice(0, limit);

    return {
      resume: {
        id: analysis.resume.id,
        fileName: analysis.resume.fileName,
        analyzedAt: analysis.createdAt,
      },
      recommendations,
    };
  }
}

interface CandidateProfile {
  readonly skills: string[];
  readonly targetRoles: string[];
  readonly recommendedKeywords: string[];
  readonly experienceLevel: string;
  readonly atsScore: number | null;
}

function buildCandidateProfile(analysis: ResumeAnalysis): CandidateProfile {
  const metadata = isRecord(analysis.parsedJson) ? analysis.parsedJson : {};
  const skills = uniqueStrings([...getStringArray(analysis.skills), ...getStringArray(metadata.recommendedKeywords)]);

  return {
    skills,
    targetRoles: getStringArray(metadata.targetRoles),
    recommendedKeywords: getStringArray(metadata.recommendedKeywords),
    experienceLevel: typeof metadata.experienceLevel === "string" ? metadata.experienceLevel : "UNKNOWN",
    atsScore: typeof metadata.atsScore === "number" ? metadata.atsScore : null,
  };
}

function scoreJob(job: CandidateJob, profile: CandidateProfile) {
  const jobText = normalizeText(`${job.title} ${job.normalizedTitle ?? ""} ${job.description} ${job.company.name}`);
  const requiredSkills = uniqueStrings([
    ...job.jobSkills.map((jobSkill) => jobSkill.skill.normalizedName),
    ...skillCatalog.filter((skill) => jobText.includes(skill)),
  ]);
  const matchedSkills = profile.skills.filter((skill) => requiredSkills.includes(normalizeText(skill)) || jobText.includes(normalizeText(skill)));
  const missingSkills = requiredSkills.filter((skill) => !profile.skills.map(normalizeText).includes(skill)).slice(0, 8);
  const titleFit = calculateTitleFit(job.title, profile.targetRoles);
  const skillCoverage = requiredSkills.length ? matchedSkills.length / requiredSkills.length : matchedSkills.length ? 0.6 : 0;
  const skillScore = Math.min(58, Math.round(matchedSkills.length * 8 + skillCoverage * 32));
  const freshnessScore = calculateFreshnessScore(job.lastSeenAt);
  const atsScore = profile.atsScore === null ? 6 : Math.round(Math.min(10, profile.atsScore / 10));
  const earlyCareerFit = calculateEarlyCareerFit(job, profile.experienceLevel);
  const matchScore = clamp(Math.round(16 + skillScore + titleFit + freshnessScore + atsScore + earlyCareerFit), 0, 100);

  return {
    job: {
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
    },
    matchScore,
    matchedSkills: uniqueStrings(matchedSkills).slice(0, 10),
    missingSkills,
    reasons: buildReasons({ matchedSkills, missingSkills, titleFit, freshnessScore, earlyCareerFit }),
  };
}

function buildReasons({
  matchedSkills,
  missingSkills,
  titleFit,
  freshnessScore,
  earlyCareerFit,
}: {
  readonly matchedSkills: readonly string[];
  readonly missingSkills: readonly string[];
  readonly titleFit: number;
  readonly freshnessScore: number;
  readonly earlyCareerFit: number;
}) {
  const reasons: string[] = [];

  if (matchedSkills.length) reasons.push(`Matches ${matchedSkills.slice(0, 4).join(", ")}.`);
  if (earlyCareerFit > 0) reasons.push("Prioritized as a fresher-friendly opportunity.");
  if (titleFit >= 14) reasons.push("Role title aligns with your resume target roles.");
  if (freshnessScore >= 8) reasons.push("Job was seen recently.");
  if (missingSkills.length) reasons.push(`Improve fit by adding ${missingSkills.slice(0, 3).join(", ")} if relevant.`);

  return reasons.length ? reasons : ["Recommendation is based on recent active jobs and your resume profile."];
}

function calculateTitleFit(title: string, targetRoles: readonly string[]) {
  const normalizedTitle = normalizeText(title);

  if (!targetRoles.length) return 0;

  return targetRoles.some((role) => {
    const tokens = normalizeText(role).split(" ").filter((token) => token.length > 2);
    return tokens.length > 0 && tokens.every((token) => normalizedTitle.includes(token));
  })
    ? 16
    : targetRoles.some((role) => normalizeText(role).split(" ").some((token) => token.length > 3 && normalizedTitle.includes(token)))
      ? 8
      : 0;
}

function calculateFreshnessScore(value: Date) {
  const elapsedDays = Math.floor((Date.now() - value.getTime()) / 86_400_000);
  if (elapsedDays <= 1) return 10;
  if (elapsedDays <= 7) return 7;
  if (elapsedDays <= 21) return 4;
  return 1;
}

function calculateEarlyCareerFit(job: CandidateJob, candidateExperienceLevel: string) {
  if (!["ENTRY", "JUNIOR", "UNKNOWN"].includes(candidateExperienceLevel)) return 0;
  if (job.employmentType === "INTERNSHIP") return 14;
  if (job.experienceLevel === "ENTRY") return 12;
  if (job.experienceLevel === "JUNIOR") return 8;
  if (Number(job.minExperience ?? 99) <= 1 || Number(job.maxExperience ?? 99) <= 2) return 8;
  if (/\b(senior|staff|principal|lead|manager|architect|director)\b/i.test(job.title)) return -18;
  return 0;
}

function getStringArray(value: unknown) {
  return Array.isArray(value) ? uniqueStrings(value.filter((item): item is string => typeof item === "string")) : [];
}

function uniqueStrings(values: readonly string[]) {
  return Array.from(new Set(values.map(normalizeText).filter(Boolean)));
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9.+#\s-]+/g, " ").replace(/\s+/g, " ").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
