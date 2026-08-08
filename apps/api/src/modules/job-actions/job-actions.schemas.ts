import { z } from "@ai-job-platform/validation";

export const jobActionParamsSchema = z.object({
  jobId: z.uuid(),
});

export const applicationParamsSchema = z.object({
  id: z.uuid(),
});

export const applicationStatusSchema = z.enum(["SAVED", "APPLIED", "INTERVIEW", "ASSESSMENT", "OFFER", "REJECTED"]);

export const upsertApplicationSchema = z.object({
  jobId: z.uuid(),
  status: applicationStatusSchema.default("SAVED"),
  notes: z.string().trim().max(2000).optional(),
  appliedAt: z.string().datetime().optional(),
  interviewAt: z.string().datetime().optional(),
  nextFollowUpAt: z.string().datetime().optional(),
});

export const updateApplicationSchema = z.object({
  status: applicationStatusSchema.optional(),
  notes: z.string().trim().max(2000).optional(),
  appliedAt: z.string().datetime().nullable().optional(),
  interviewAt: z.string().datetime().nullable().optional(),
  nextFollowUpAt: z.string().datetime().nullable().optional(),
});

export const coverLetterPdfSchema = z.object({
  subjectLine: z.string().trim().min(1).max(160),
  coverLetter: z.string().trim().min(120).max(3500),
});

export const applicationListQuerySchema = z.object({
  status: applicationStatusSchema.optional(),
});

export type UpsertApplicationInput = z.infer<typeof upsertApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type ApplicationListQuery = z.infer<typeof applicationListQuerySchema>;
export type CoverLetterPdfInput = z.infer<typeof coverLetterPdfSchema>;
