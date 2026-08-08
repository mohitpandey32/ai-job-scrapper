import type { PrismaClient } from "@ai-job-platform/database";
import type { UpdateProfileInput } from "./profile.schemas";

export class ProfileRepository {
  constructor(private readonly db: PrismaClient) {}

  findByUserId(userId: string) {
    return this.db.userProfile.findUnique({
      where: { userId },
    });
  }

  upsert(userId: string, input: UpdateProfileInput) {
    return this.db.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        country: "India",
        fullName: input.fullName,
        phone: input.phone,
        locationCity: input.locationCity,
        locationState: input.locationState,
        targetRoles: input.targetRoles ?? undefined,
        experienceYears: input.experienceYears,
        preferredLocations: input.preferredLocations ?? undefined,
        remotePreference: input.remotePreference,
        expectedSalaryMin: input.expectedSalaryMin,
        expectedSalaryMax: input.expectedSalaryMax,
        noticePeriod: input.noticePeriod,
        careerGoal: input.careerGoal,
      },
      update: {
        fullName: input.fullName,
        phone: input.phone,
        locationCity: input.locationCity,
        locationState: input.locationState,
        targetRoles: input.targetRoles ?? undefined,
        experienceYears: input.experienceYears,
        preferredLocations: input.preferredLocations ?? undefined,
        remotePreference: input.remotePreference,
        expectedSalaryMin: input.expectedSalaryMin,
        expectedSalaryMax: input.expectedSalaryMax,
        noticePeriod: input.noticePeriod,
        careerGoal: input.careerGoal,
      },
    });
  }
}

