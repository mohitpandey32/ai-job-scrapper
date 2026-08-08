import { Router } from "express";
import { AppError } from "../../common/errors/app-error";
import { asyncHandler } from "../../common/http/async-handler";
import {
  applicationListQuerySchema,
  applicationParamsSchema,
  jobActionParamsSchema,
  updateApplicationSchema,
  upsertApplicationSchema,
  coverLetterPdfSchema,
} from "./job-actions.schemas";
import type { JobActionsService } from "./job-actions.service";

export function createJobActionsRouter(service: JobActionsService) {
  const router = Router();

  router.get(
    "/jobs/:jobId",
    asyncHandler(async (request, response) => {
      const userId = getUserId(request.user);
      const params = jobActionParamsSchema.parse(request.params);
      const job = await service.getJobDetail(userId, params.jobId);
      response.json({ job });
    }),
  );

  router.post(
    "/jobs/:jobId/cover-letter",
    asyncHandler(async (request, response) => {
      const userId = getUserId(request.user);
      const params = jobActionParamsSchema.parse(request.params);
      const coverLetter = await service.generateCoverLetter(userId, params.jobId);
      response.status(201).json({ coverLetter });
    }),
  );

  router.post(
    "/jobs/:jobId/cover-letter/pdf",
    asyncHandler(async (request, response) => {
      const userId = getUserId(request.user);
      const params = jobActionParamsSchema.parse(request.params);
      const input = coverLetterPdfSchema.parse(request.body);
      const pdf = await service.generateCoverLetterPdf(userId, params.jobId, input);

      response
        .status(200)
        .set({
          "content-type": "application/pdf",
          "content-disposition": `attachment; filename="${pdf.fileName}"`,
          "content-length": String(pdf.buffer.length),
          "cache-control": "private, no-store",
        })
        .send(pdf.buffer);
    }),
  );

  router.post(
    "/saved-jobs/:jobId",
    asyncHandler(async (request, response) => {
      const userId = getUserId(request.user);
      const params = jobActionParamsSchema.parse(request.params);
      const result = await service.saveJob(userId, params.jobId);
      response.status(201).json(result);
    }),
  );

  router.delete(
    "/saved-jobs/:jobId",
    asyncHandler(async (request, response) => {
      const userId = getUserId(request.user);
      const params = jobActionParamsSchema.parse(request.params);
      const result = await service.unsaveJob(userId, params.jobId);
      response.json(result);
    }),
  );

  router.get(
    "/saved-jobs",
    asyncHandler(async (request, response) => {
      const userId = getUserId(request.user);
      const result = await service.listSavedJobs(userId);
      response.json(result);
    }),
  );

  router.get(
    "/applications",
    asyncHandler(async (request, response) => {
      const userId = getUserId(request.user);
      const query = applicationListQuerySchema.parse(request.query);
      const result = await service.listApplications(userId, query);
      response.json(result);
    }),
  );

  router.post(
    "/applications",
    asyncHandler(async (request, response) => {
      const userId = getUserId(request.user);
      const input = upsertApplicationSchema.parse(request.body);
      const application = await service.upsertApplication(userId, input);
      response.status(201).json({ application });
    }),
  );

  router.patch(
    "/applications/:id",
    asyncHandler(async (request, response) => {
      const userId = getUserId(request.user);
      const params = applicationParamsSchema.parse(request.params);
      const input = updateApplicationSchema.parse(request.body);
      const application = await service.updateApplication(userId, params.id, input);
      response.json({ application });
    }),
  );

  return router;
}

function getUserId(user: Express.Request["user"]) {
  if (!user) {
    throw new AppError(401, "Authentication required.", "AUTH_REQUIRED");
  }

  return user.id;
}
