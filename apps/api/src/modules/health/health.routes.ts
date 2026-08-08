import { Router } from "express";
import type { PrismaClient } from "@ai-job-platform/database";
import { asyncHandler } from "../../common/http/async-handler";

export function createHealthRouter(db: PrismaClient) {
  const router = Router();

  router.get("/", (_request, response) => {
    response.json({
      status: "ok",
      service: "api",
      timestamp: new Date().toISOString(),
    });
  });

  router.get(
    "/ready",
    asyncHandler(async (_request, response) => {
      await db.$queryRaw`SELECT 1`;
      response.json({
        status: "ready",
        dependencies: {
          database: "ok",
        },
        timestamp: new Date().toISOString(),
      });
    }),
  );

  return router;
}

