import { existsSync } from "node:fs";
import path from "node:path";
import { config as loadDotenv } from "dotenv";
import { z } from "zod";

loadProjectEnv();

const optionalString = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  });

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_NAME: z.string().default("ai-job-aggregation-career-assistant"),
  APP_URL: z.string().url().default("http://localhost:5173"),
  API_URL: z.string().url().default("http://localhost:3000"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  COOKIE_DOMAIN: z.string().optional(),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_ACCESS_TOKEN_SECRET: z.string().min(32),
  JWT_REFRESH_TOKEN_SECRET: z.string().min(32),
  AI_PROVIDER: z.enum(["deterministic", "gemini", "openai"]).default("gemini"),
  GEMINI_API_KEY: optionalString,
  GEMINI_MODEL: z.string().default("gemini-3.1-flash-lite"),
  OPENAI_API_KEY: optionalString,
});

export type AppConfig = ReturnType<typeof loadConfig>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  const parsed = environmentSchema.parse(env);
  const isProduction = parsed.NODE_ENV === "production";

  return {
    nodeEnv: parsed.NODE_ENV,
    appName: parsed.APP_NAME,
    appUrl: parsed.APP_URL,
    apiUrl: parsed.API_URL,
    corsOrigin: parsed.CORS_ORIGIN,
    cookieDomain: parsed.COOKIE_DOMAIN,
    port: parsed.PORT,
    databaseUrl: parsed.DATABASE_URL,
    redisUrl: parsed.REDIS_URL,
    jwtAccessTokenSecret: parsed.JWT_ACCESS_TOKEN_SECRET,
    jwtRefreshTokenSecret: parsed.JWT_REFRESH_TOKEN_SECRET,
    aiProvider: parsed.AI_PROVIDER,
    geminiApiKey: parsed.GEMINI_API_KEY,
    geminiModel: parsed.GEMINI_MODEL,
    openaiApiKey: parsed.OPENAI_API_KEY,
    isProduction,
  };
}

function loadProjectEnv() {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../.env"),
    path.resolve(process.cwd(), "../../.env"),
  ];

  const envPath = candidates.find((candidate) => existsSync(candidate));
  if (envPath) {
    loadDotenv({ path: envPath, override: false, quiet: true });
  }
}
