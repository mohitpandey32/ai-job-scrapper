import { apiRequest } from "./client";

export interface JobCompany {
  readonly id: string;
  readonly name: string;
  readonly industry?: string | null;
  readonly website?: string | null;
}

export interface JobListItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly applyUrl: string;
  readonly locationCity?: string | null;
  readonly locationState?: string | null;
  readonly country: string;
  readonly isRemote: boolean;
  readonly isHybrid: boolean;
  readonly employmentType: string;
  readonly experienceLevel: string;
  readonly minExperience?: string | number | null;
  readonly maxExperience?: string | number | null;
  readonly salaryMin?: number | null;
  readonly salaryMax?: number | null;
  readonly salaryCurrency?: string | null;
  readonly postedAt?: string | null;
  readonly lastSeenAt: string;
  readonly company: JobCompany;
  readonly earlyCareerQuality?: {
    readonly score: number;
    readonly label: "STRONG" | "MEDIUM" | "WEAK";
    readonly signals: string[];
  };
}

export interface JobsSearchResponse {
  readonly items: JobListItem[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  };
}

export interface JobsFacetsResponse {
  readonly locations: Array<{ readonly value: string | null; readonly count: number }>;
  readonly companies: Array<{ readonly id: string; readonly value: string; readonly count: number }>;
  readonly experienceLevels: Array<{ readonly value: string; readonly count: number }>;
  readonly workModes: {
    readonly remote: number;
    readonly hybrid: number;
  };
  readonly careerStages: {
    readonly earlyCareer: number;
    readonly internships: number;
    readonly strongEarlyCareer: number;
  };
}

export interface JobsSearchParams {
  readonly q?: string;
  readonly location?: string;
  readonly company?: string;
  readonly remote?: boolean;
  readonly hybrid?: boolean;
  readonly careerStage?: "early" | "all";
  readonly earlyCareerFilter?: "all" | "internships" | "fresher" | "zero_one" | "remote_internships";
  readonly experienceLevel?: string;
  readonly minSalary?: number;
  readonly sortBy?: string;
  readonly page?: number;
  readonly limit?: number;
}

export function searchJobs(params: JobsSearchParams) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== false) {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return apiRequest<JobsSearchResponse>(`/api/v1/jobs${query ? `?${query}` : ""}`);
}

export function getJobFacets() {
  return apiRequest<JobsFacetsResponse>("/api/v1/jobs/facets");
}

export function autocompleteJobs(q: string) {
  return apiRequest<{ suggestions: string[] }>(`/api/v1/jobs/autocomplete?q=${encodeURIComponent(q)}`);
}
