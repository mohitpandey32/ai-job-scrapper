import { prisma } from "@ai-job-platform/database";
import { createApp } from "./app";

const { app, config, logger } = createApp();

const server = app.listen(config.port, () => {
  logger.info({ port: config.port }, "API server started");
});

async function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down API server");

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

