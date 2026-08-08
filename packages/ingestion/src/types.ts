export type SourceType =
  | "GREENHOUSE"
  | "LEVER"
  | "ASHBY"
  | "COMPANY_PAGE"
  | "PUBLIC_WEB"
  | "MANUAL";

export type SourceRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type TermsReviewStatus =
  | "NOT_REVIEWED"
  | "ALLOWED"
  | "RESTRICTED"
  | "BLOCKED";

export type EmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "INTERNSHIP"
  | "TEMPORARY"
  | "FREELANCE"
  | "UNKNOWN";

export type ExperienceLevel =
  | "ENTRY"
  | "JUNIOR"
  | "MID"
  | "SENIOR"
  | "LEAD"
  | "EXECUTIVE"
  | "UNKNOWN";

export interface SourceConfig {
  readonly name: string;
  readonly sourceType: SourceType;
  readonly sourceUrl: string;
  readonly country: string;
  readonly riskLevel: SourceRiskLevel;
  readonly termsReviewStatus: TermsReviewStatus;
  readonly crawlFrequencyMinutes: number;
  readonly allowed: boolean;
  readonly notes?: string;
}

export interface SourcePolicyDecision {
  readonly allowed: boolean;
  readonly riskLevel: SourceRiskLevel;
  readonly reason: string;
  readonly maxRequestsPerHour: number;
  readonly allowBrowserRender: boolean;
}

export interface RawJobPosting {
  readonly sourceType: SourceType;
  readonly sourceUrl: string;
  readonly externalJobId?: string;
  readonly title: string;
  readonly companyName?: string;
  readonly description?: string;
  readonly applyUrl: string;
  readonly canonicalUrl?: string;
  readonly location?: string;
  readonly postedAt?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface NormalizedJobPosting {
  readonly sourceType: SourceType;
  readonly sourceUrl: string;
  readonly externalJobId?: string;
  readonly companyName: string;
  readonly title: string;
  readonly normalizedTitle: string;
  readonly description: string;
  readonly applyUrl: string;
  readonly canonicalUrl?: string;
  readonly locationCity?: string;
  readonly locationState?: string;
  readonly country: string;
  readonly isRemote: boolean;
  readonly isHybrid: boolean;
  readonly employmentType: EmploymentType;
  readonly experienceLevel: ExperienceLevel;
  readonly minExperience?: number;
  readonly maxExperience?: number;
  readonly salaryMin?: number;
  readonly salaryMax?: number;
  readonly salaryCurrency?: string;
  readonly postedAt?: string;
  readonly contentHashInput: string;
  readonly metadata?: Record<string, unknown>;
}

export interface JobSourceAdapter {
  readonly sourceType: SourceType;
  canHandle(source: SourceConfig): boolean;
  fetchJobs(source: SourceConfig): Promise<RawJobPosting[]>;
}

