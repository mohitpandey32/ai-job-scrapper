import { z } from "zod";

export const coverLetterSchema = z.object({
  subjectLine: z.string().trim().min(1).max(160),
  coverLetter: z.string().trim().min(120).max(3500),
});

export interface CoverLetterCandidateContext {
  readonly summary: string | null;
  readonly skills: string[];
  readonly strengths: string[];
  readonly targetRoles: string[];
}

export interface CoverLetterJobContext {
  readonly title: string;
  readonly companyName: string;
  readonly location: string;
  readonly description: string;
  readonly skills: string[];
}

export interface CoverLetterGeneratorInput {
  readonly candidate: CoverLetterCandidateContext;
  readonly job: CoverLetterJobContext;
}

export interface CoverLetterGeneratorResult {
  readonly subjectLine: string;
  readonly coverLetter: string;
  readonly modelProvider: string;
  readonly modelName: string;
  readonly fallbackUsed?: boolean;
}

export interface CoverLetterGenerator {
  generateCoverLetter(input: CoverLetterGeneratorInput): Promise<CoverLetterGeneratorResult>;
}
