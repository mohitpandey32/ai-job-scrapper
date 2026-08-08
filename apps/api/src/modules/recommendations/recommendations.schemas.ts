import { z } from "@ai-job-platform/validation";

export const jobRecommendationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type JobRecommendationsQuery = z.infer<typeof jobRecommendationsQuerySchema>;
