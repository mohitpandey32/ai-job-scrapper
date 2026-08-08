import { Router } from "express";
import { AppError } from "../../common/errors/app-error";
import { asyncHandler } from "../../common/http/async-handler";
import { validateBody } from "../../common/middleware/request-validation.middleware";
import type { ProfileRepository } from "./profile.repository";
import { updateProfileSchema } from "./profile.schemas";

export function createProfileRouter(profileRepository: ProfileRepository) {
  const router = Router();

  router.get(
    "/me",
    asyncHandler(async (request, response) => {
      if (!request.user) {
        throw new AppError(401, "Authentication required.", "AUTH_REQUIRED");
      }

      const profile = await profileRepository.findByUserId(request.user.id);
      response.json({ profile });
    }),
  );

  router.put(
    "/me",
    validateBody(updateProfileSchema),
    asyncHandler(async (request, response) => {
      if (!request.user) {
        throw new AppError(401, "Authentication required.", "AUTH_REQUIRED");
      }

      const profile = await profileRepository.upsert(request.user.id, request.body);
      response.json({ profile });
    }),
  );

  return router;
}

