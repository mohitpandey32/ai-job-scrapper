import type { Response } from "express";
import type { AppConfig } from "@ai-job-platform/config";

const accessTokenCookie = "access_token";
const refreshTokenCookie = "refresh_token";
const csrfCookie = "csrf_token";

export const authCookieNames = {
  accessToken: accessTokenCookie,
  refreshToken: refreshTokenCookie,
  csrfToken: csrfCookie,
} as const;

export function setAuthCookies(
  response: Response,
  config: AppConfig,
  tokens: { accessToken: string; refreshToken: string; csrfToken: string },
) {
  response.cookie(accessTokenCookie, tokens.accessToken, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "lax",
    domain: config.cookieDomain,
    path: "/",
    maxAge: 15 * 60 * 1000,
  });

  response.cookie(refreshTokenCookie, tokens.refreshToken, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "lax",
    domain: config.cookieDomain,
    path: "/api/v1/auth",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  response.cookie(csrfCookie, tokens.csrfToken, {
    httpOnly: false,
    secure: config.isProduction,
    sameSite: "lax",
    domain: config.cookieDomain,
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(response: Response, config: AppConfig) {
  const commonOptions = {
    secure: config.isProduction,
    sameSite: "lax" as const,
    domain: config.cookieDomain,
  };

  response.clearCookie(accessTokenCookie, { ...commonOptions, path: "/" });
  response.clearCookie(refreshTokenCookie, { ...commonOptions, path: "/api/v1/auth" });
  response.clearCookie(csrfCookie, { ...commonOptions, path: "/" });
}

