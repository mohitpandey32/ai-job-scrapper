import { z } from "@ai-job-platform/validation";

export const jobSearchQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  location: z.string().trim().max(80).optional(),
  company: z.string().trim().max(120).optional(),
  remote: z.enum(["true", "false"]).optional(),
  hybrid: z.enum(["true", "false"]).optional(),
  careerStage: z.enum(["early", "all"]).default("early"),
  earlyCareerFilter: z.enum(["all", "internships", "fresher", "zero_one", "remote_internships"]).default("all"),
  experienceLevel: z.enum(["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE", "UNKNOWN"]).optional(),
  minSalary: z.coerce.number().int().min(0).optional(),
  sortBy: z.enum(["early_career", "newest", "salary_high", "salary_low", "company"]).default("early_career"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const jobIdParamsSchema = z.object({
  id: z.uuid(),
});

export const jobAutocompleteQuerySchema = z.object({
  q: z.string().trim().min(1).max(80),
  limit: z.coerce.number().int().min(1).max(20).default(8),
});

export type JobSearchQuery = z.infer<typeof jobSearchQuerySchema>;
export type JobAutocompleteQuery = z.infer<typeof jobAutocompleteQuerySchema>;
