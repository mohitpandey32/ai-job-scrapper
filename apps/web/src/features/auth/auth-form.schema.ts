import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const signupFormSchema = loginFormSchema.extend({
  fullName: z.string().trim().min(1, "Name is required.").max(120, "Name is too long."),
});

export type LoginFormInput = z.infer<typeof loginFormSchema>;
export type SignupFormInput = z.infer<typeof signupFormSchema>;

