import { z } from "zod";

export const resumeAiAnalysisSchema = z.object({
  professionalSummary: z.string().trim().min(1).max(1200),
  detectedSkills: z.array(z.string().trim().min(1).max(80)).max(40),
  targetRoles: z.array(z.string().trim().min(1).max(100)).max(8),
  experienceLevel: z.enum(["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE", "UNKNOWN"]),
  strengths: z.array(z.string().trim().min(1).max(240)).max(8),
  gaps: z.array(z.string().trim().min(1).max(240)).max(8),
  improvementSuggestions: z.array(z.string().trim().min(1).max(280)).max(10),
  atsScore: z.number().min(0).max(100),
  recommendedKeywords: z.array(z.string().trim().min(1).max(80)).max(30),
});

export type ResumeAiAnalysis = z.infer<typeof resumeAiAnalysisSchema>;

export interface ResumeAnalyzerResult extends ResumeAiAnalysis {
  readonly modelProvider: string;
  readonly modelName: string;
  readonly confidenceScore: number;
  readonly fallbackUsed?: boolean;
}

export interface ResumeAnalyzerInput {
  readonly resumeText: string;
}

export interface ResumeAnalyzer {
  analyzeResume(input: ResumeAnalyzerInput): Promise<ResumeAnalyzerResult>;
}
