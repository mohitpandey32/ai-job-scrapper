import type { JobListItem } from "./jobs.api";
import { apiRequest } from "./client";

export interface JobRecommendation {
  readonly job: JobListItem;
  readonly matchScore: number;
  readonly matchedSkills: string[];
  readonly missingSkills: string[];
  readonly reasons: string[];
}

export interface JobRecommendationsResponse {
  readonly resume: {
    readonly id: string;
    readonly fileName: string;
    readonly analyzedAt: string;
  };
  readonly recommendations: JobRecommendation[];
}

export function getJobRecommendations(limit = 20) {
  return apiRequest<JobRecommendationsResponse>(`/api/v1/recommendations/jobs?limit=${limit}`);
}
