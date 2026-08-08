import { z } from "@ai-job-platform/validation";

export const signupSchema = z.object({
  email: z.email().max(320).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  fullName: z.string().trim().min(1).max(120).optional(),
});

export const loginSchema = z.object({
  email: z.email().max(320).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

