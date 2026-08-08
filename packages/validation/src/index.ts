import { z } from "zod";

export const uuidSchema = z.uuid();
export const emailSchema = z.email().max(320).transform((value) => value.toLowerCase());

export function nonEmptyString(maxLength: number) {
  return z.string().trim().min(1).max(maxLength);
}

export { z };

