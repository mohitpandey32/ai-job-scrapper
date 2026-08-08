import { ApiError } from "./client";
import type { JobListItem } from "./jobs.api";
import { apiRequest } from "./client";

export type ApplicationStatus = "SAVED" | "APPLIED" | "INTERVIEW" | "ASSESSMENT" | "OFFER" | "REJECTED";

export interface ApplicationState {
  readonly id: string;
  readonly status: ApplicationStatus;
  readonly notes?: string | null;
  readonly appliedAt?: string | null;
  readonly interviewAt?: string | null;
  readonly nextFollowUpAt?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ApplicationRecord extends ApplicationState {
  readonly job: JobListItem;
}

export interface JobDetail extends JobListItem {
  readonly canonicalUrl?: string | null;
  readonly skills: Array<{
    readonly id: string;
    readonly name: string;
    readonly importance: string;
  }>;
  readonly userState: {
    readonly saved: boolean;
    readonly application: ApplicationState | null;
  };
}

export interface GeneratedCoverLetter {
  readonly subjectLine: string;
  readonly coverLetter: string;
  readonly modelProvider: string;
  readonly modelName: string;
  readonly fallbackUsed: boolean;
  readonly generatedAt: string;
}

export function getJobDetail(jobId: string) {
  return apiRequest<{ job: JobDetail }>(`/api/v1/jobs/${jobId}`);
}

export function saveJob(jobId: string) {
  return apiRequest<{ saved: true }>(`/api/v1/saved-jobs/${jobId}`, { method: "POST" });
}

export function unsaveJob(jobId: string) {
  return apiRequest<{ saved: false }>(`/api/v1/saved-jobs/${jobId}`, { method: "DELETE" });
}

export function listSavedJobs() {
  return apiRequest<{ items: Array<{ readonly id: string; readonly createdAt: string; readonly job: JobListItem }> }>("/api/v1/saved-jobs");
}

export function listApplications(status?: ApplicationStatus) {
  return apiRequest<{ items: ApplicationRecord[] }>(`/api/v1/applications${status ? `?status=${status}` : ""}`);
}

export function upsertApplication(input: {
  readonly jobId: string;
  readonly status?: ApplicationStatus;
  readonly notes?: string;
  readonly appliedAt?: string;
  readonly interviewAt?: string;
  readonly nextFollowUpAt?: string;
}) {
  return apiRequest<{ application: ApplicationRecord }>(`/api/v1/applications`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateApplication(
  id: string,
  input: {
    readonly status?: ApplicationStatus;
    readonly notes?: string;
    readonly appliedAt?: string | null;
    readonly interviewAt?: string | null;
    readonly nextFollowUpAt?: string | null;
  },
) {
  return apiRequest<{ application: ApplicationRecord }>(`/api/v1/applications/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function generateCoverLetter(jobId: string) {
  return apiRequest<{ coverLetter: GeneratedCoverLetter }>(`/api/v1/jobs/${jobId}/cover-letter`, {
    method: "POST",
  });
}

export async function downloadCoverLetterPdf(jobId: string, input: { readonly subjectLine: string; readonly coverLetter: string }) {
  const headers = new Headers();
  headers.set("content-type", "application/json");
  const csrfToken = readCookie("csrf_token");
  if (csrfToken) {
    headers.set("x-csrf-token", csrfToken);
  }

  const response = await fetch(`/api/v1/jobs/${jobId}/cover-letter/pdf`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => undefined);
    const error = payload?.error;
    throw new ApiError(response.status, error?.message ?? "PDF download failed.", error?.code ?? "PDF_DOWNLOAD_FAILED", error?.details);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition");
  return {
    blob,
    fileName: parseFileName(disposition) ?? "cover-letter.pdf",
  };
}

function readCookie(name: string) {
  const prefix = `${name}=`;
  const cookie = document.cookie.split("; ").find((entry) => entry.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : undefined;
}

function parseFileName(disposition: string | null) {
  const match = disposition?.match(/filename="([^"]+)"/i);
  return match?.[1];
}
