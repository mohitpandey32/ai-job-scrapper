import { Router } from "express";
import { asyncHandler } from "../../common/http/async-handler";
import type { JobsRepository } from "./jobs.repository";
import { jobAutocompleteQuerySchema, jobIdParamsSchema, jobSearchQuerySchema } from "./jobs.schemas";

export function createJobsRouter(jobsRepository: JobsRepository) {
  const router = Router();

  router.get(
    "/facets",
    asyncHandler(async (_request, response) => {
      const result = await jobsRepository.facets();
      response.json(result);
    }),
  );

  router.get(
    "/autocomplete",
    asyncHandler(async (request, response) => {
      const query = jobAutocompleteQuerySchema.parse(request.query);
      const result = await jobsRepository.autocomplete(query);
      response.json(result);
    }),
  );

  router.get(
    "/",
    asyncHandler(async (request, response) => {
      const query = jobSearchQuerySchema.parse(request.query);
      const result = await jobsRepository.search(query);
      response.json(result);
    }),
  );

  router.get(
    "/:id",
    asyncHandler(async (request, response) => {
      const params = jobIdParamsSchema.parse(request.params);
      const result = await jobsRepository.findById(params.id);
      response.json({ job: result });
    }),
  );

  return router;
}
