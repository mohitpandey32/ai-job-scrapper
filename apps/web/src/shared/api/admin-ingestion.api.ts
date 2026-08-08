import { apiRequest } from "./client";

export interface CreateIngestionSourceInput {
  readonly companyName: string;
  readonly companySlug?: string;
  readonly companyWebsite?: string;
  readonly industry?: string;
  readonly headquarters?: string;
  readonly sourceType: "GREENHOUSE" | "LEVER" | "ASHBY";
  readonly sourceUrl: string;
  readonly crawlFrequencyMinutes: number;
  readonly maxRequestsPerHour: number;
  readonly notes?: string;
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

export interface TriggerIngestionRunResponse {
  readonly summary: IngestionRunSummary;
  readonly startedAt: string;
  readonly finishedAt: string;
}

export interface IngestionStatsResponse {
  readonly activeJobs: number;
  readonly expiredJobs: number;
  readonly removedJobs: number;
  readonly duplicateJobs: number;
  readonly activeJobsSeenToday: number;
  readonly activeJobsStaleRisk: number;
  readonly earlyCareerJobs: number;
  readonly internshipJobs: number;
  readonly strongEarlyCareerJobs: number;
  readonly weakEarlyCareerJobs: number;
}

export function listIngestionSources() {
  return apiRequest<{ sources: unknown[] }>("/api/v1/admin/ingestion/sources");
}

export function createIngestionSource(input: CreateIngestionSourceInput) {
  return apiRequest<{ source: unknown }>("/api/v1/admin/ingestion/sources", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listIngestionRuns() {
  return apiRequest<{ runs: unknown[] }>("/api/v1/admin/ingestion/runs");
}

export function triggerIngestionRun() {
  return apiRequest<TriggerIngestionRunResponse>("/api/v1/admin/ingestion/runs/trigger", {
    method: "POST",
  });
}

export function getIngestionStats() {
  return apiRequest<IngestionStatsResponse>("/api/v1/admin/ingestion/stats");
}

export function listIngestionErrors() {
  return apiRequest<{ errors: unknown[] }>("/api/v1/admin/ingestion/errors");
}
