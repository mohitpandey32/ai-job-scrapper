import { apiRequest } from "./client";

export interface Profile {
  readonly id: string;
  readonly fullName?: string | null;
  readonly phone?: string | null;
  readonly locationCity?: string | null;
  readonly locationState?: string | null;
  readonly targetRoles?: string[] | null;
  readonly experienceYears?: string | number | null;
  readonly remotePreference?: "REMOTE" | "HYBRID" | "ONSITE" | "ANY";
}

export interface ProfileResponse {
  readonly profile: Profile | null;
}

export function getProfile() {
  return apiRequest<ProfileResponse>("/api/v1/profiles/me");
}

export function updateProfile(input: Record<string, unknown>) {
  return apiRequest<ProfileResponse>("/api/v1/profiles/me", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

