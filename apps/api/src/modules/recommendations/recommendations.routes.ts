import { Router } from "express";
import { AppError } from "../../common/errors/app-error";
import { asyncHandler } from "../../common/http/async-handler";
import { jobRecommendationsQuerySchema } from "./recommendations.schemas";
import type { RecommendationsService } from "./recommendations.service";

export function createRecommendationsRouter(service: RecommendationsService) {
  const router = Router();

  router.get(
    "/jobs",
    asyncHandler(async (request, response) => {
      if (!request.user) {
        throw new AppError(401, "Authentication required.", "AUTH_REQUIRED");
      }

      const query = jobRecommendationsQuerySchema.parse(request.query);
      const result = await service.recommendJobsForUser(request.user.id, query.limit);
      response.json(result);
    }),
  );

  return router;
}
