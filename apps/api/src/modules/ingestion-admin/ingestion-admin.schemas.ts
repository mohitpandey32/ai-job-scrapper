import { nonEmptyString, z } from "@ai-job-platform/validation";

export const createIngestionSourceSchema = z.object({
  companyName: nonEmptyString(160),
  companySlug: z
    .string()
    .trim()
    .max(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only.")
    .optional(),
  companyWebsite: z.url().max(500).optional(),
  industry: z.string().trim().max(120).optional(),
  headquarters: z.string().trim().max(160).optional(),
  sourceType: z.enum(["GREENHOUSE", "LEVER", "ASHBY"]),
  sourceUrl: z.url().max(1000),
  crawlFrequencyMinutes: z.number().int().min(60).max(10_080).default(720),
  maxRequestsPerHour: z.number().int().min(1).max(120).default(12),
  notes: z.string().trim().max(1000).optional(),
});

export type CreateIngestionSourceInput = z.infer<typeof createIngestionSourceSchema>;
