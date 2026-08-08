import type { NextFunction, Request, Response } from "express";
import { authCookieNames } from "../http/cookies";
import { AppError } from "../errors/app-error";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);
const csrfExemptPaths = new Set([
  "/api/v1/auth/signup",
  "/api/v1/auth/login",
  "/api/v1/auth/refresh",
  "/api/v1/auth/csrf",
]);

export function csrfGuard(request: Request, _response: Response, next: NextFunction) {
  if (safeMethods.has(request.method) || csrfExemptPaths.has(request.path)) {
    next();
    return;
  }

  const cookieToken = request.cookies?.[authCookieNames.csrfToken];
  const headerToken = request.header("x-csrf-token");

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    next(new AppError(403, "CSRF token is missing or invalid.", "CSRF_INVALID"));
    return;
  }

  next();
}

