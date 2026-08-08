import type { NextFunction, Request, Response } from "express";
import { authCookieNames } from "../http/cookies";
import type { TokenService } from "../../modules/auth/token.service";
import { AppError } from "../errors/app-error";

export interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
  readonly role: "USER" | "ADMIN";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function requireAuth(tokenService: TokenService) {
  return async (request: Request, _response: Response, next: NextFunction) => {
    try {
      const accessToken = request.cookies?.[authCookieNames.accessToken];

      if (!accessToken) {
        throw new AppError(401, "Authentication required.", "AUTH_REQUIRED");
      }

      const payload = await tokenService.verifyAccessToken(accessToken);
      request.user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
      };
      next();
    } catch (error) {
      next(error instanceof AppError ? error : new AppError(401, "Invalid session.", "INVALID_SESSION"));
    }
  };
}

export function requireAdmin(request: Request, _response: Response, next: NextFunction) {
  if (request.user?.role !== "ADMIN") {
    next(new AppError(403, "Admin access required.", "ADMIN_REQUIRED"));
    return;
  }

  next();
}

