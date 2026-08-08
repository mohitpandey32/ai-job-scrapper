import { z } from "@ai-job-platform/validation";

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  locationCity: z.string().trim().min(1).max(80).optional(),
  locationState: z.string().trim().min(1).max(80).optional(),
  targetRoles: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  experienceYears: z.number().min(0).max(60).optional(),
  preferredLocations: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  remotePreference: z.enum(["REMOTE", "HYBRID", "ONSITE", "ANY"]).optional(),
  expectedSalaryMin: z.number().int().min(0).optional(),
  expectedSalaryMax: z.number().int().min(0).optional(),
  noticePeriod: z.string().trim().max(80).optional(),
  careerGoal: z.string().trim().max(1000).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

