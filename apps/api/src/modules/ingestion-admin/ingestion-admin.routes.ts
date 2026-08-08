import { Router } from "express";
import { asyncHandler } from "../../common/http/async-handler";
import { validateBody } from "../../common/middleware/request-validation.middleware";
import type { IngestionAdminRepository } from "./ingestion-admin.repository";
import { createIngestionSourceSchema } from "./ingestion-admin.schemas";
import type { IngestionAdminService } from "./ingestion-admin.service";

export function createIngestionAdminRouter(repository: IngestionAdminRepository, service: IngestionAdminService) {
  const router = Router();

  router.post(
    "/sources",
    validateBody(createIngestionSourceSchema),
    asyncHandler(async (request, response) => {
      const source = await repository.createSource(request.body);
      response.status(201).json({ source });
    }),
  );

  router.post(
    "/runs/trigger",
    asyncHandler(async (_request, response) => {
      const run = await service.runNow();
      response.json(run);
    }),
  );

  router.get(
    "/stats",
    asyncHandler(async (_request, response) => {
      const stats = await repository.getStats();
      response.json(stats);
    }),
  );

  router.get(
    "/sources",
    asyncHandler(async (_request, response) => {
      const sources = await repository.listSources();
      response.json({ sources });
    }),
  );

  router.get(
    "/runs",
    asyncHandler(async (_request, response) => {
      const runs = await repository.listRecentRuns();
      response.json({ runs });
    }),
  );

  router.get(
    "/errors",
    asyncHandler(async (_request, response) => {
      const errors = await repository.listRecentErrors();
      response.json({ errors });
    }),
  );

  return router;
}
