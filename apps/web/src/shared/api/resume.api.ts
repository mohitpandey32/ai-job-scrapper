import { apiRequest } from "./client";

export interface ResumeAnalysis {
  readonly id: string;
  readonly summary: string | null;
  readonly skills: string[] | null;
  readonly strengths: string[] | null;
  readonly gaps: string[] | null;
  readonly atsScore: number | null;
  readonly targetRoles: string[];
  readonly experienceLevel: string;
  readonly recommendedKeywords: string[];
  readonly improvementSuggestions: string[];
  readonly fallbackUsed: boolean;
  readonly createdAt: string;
}

export interface ResumeRecord {
  readonly id: string;
  readonly fileName: string;
  readonly fileType: string;
  readonly fileSize: number;
  readonly parseStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  readonly uploadedAt: string;
  readonly analysis: ResumeAnalysis | null;
}

export function getLatestResume() {
  return apiRequest<{ resume: ResumeRecord | null }>("/api/v1/resumes/latest");
}

export function uploadResume(file: File) {
  const formData = new FormData();
  formData.append("resume", file);

  return apiRequest<{ resume: ResumeRecord; parseError?: string }>("/api/v1/resumes/upload", {
    method: "POST",
    body: formData,
  });
}
