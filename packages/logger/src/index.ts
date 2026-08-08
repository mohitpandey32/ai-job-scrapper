import pino from "pino";

export function createLogger(serviceName: string) {
  return pino({
    name: serviceName,
    level: process.env.LOG_LEVEL ?? "info",
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "password",
        "passwordHash",
        "refreshToken",
        "accessToken",
      ],
      remove: true,
    },
  });
}

export type AppLogger = ReturnType<typeof createLogger>;

