import { Router } from "express";
import type { AppConfig } from "@ai-job-platform/config";
import { authCookieNames, clearAuthCookies, setAuthCookies } from "../../common/http/cookies";
import { asyncHandler } from "../../common/http/async-handler";
import { requireAuth } from "../../common/middleware/auth.middleware";
import { validateBody } from "../../common/middleware/request-validation.middleware";
import { AppError } from "../../common/errors/app-error";
import type { AuthService } from "./auth.service";
import { loginSchema, signupSchema } from "./auth.schemas";
import type { TokenService } from "./token.service";

export function createAuthRouter(dependencies: {
  readonly authService: AuthService;
  readonly tokenService: TokenService;
  readonly config: AppConfig;
}) {
  const router = Router();

  router.get("/csrf", (request, response) => {
    const csrfToken = dependencies.tokenService.createCsrfToken();

    response.cookie(authCookieNames.csrfToken, csrfToken, {
      httpOnly: false,
      secure: dependencies.config.isProduction,
      sameSite: "lax",
      domain: dependencies.config.cookieDomain,
      path: "/",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    response.json({ csrfToken });
  });

  router.post(
    "/signup",
    validateBody(signupSchema),
    asyncHandler(async (request, response) => {
      const result = await dependencies.authService.signup(request.body, getRequestMeta(request));
      setAuthCookies(response, dependencies.config, result);
      response.status(201).json({ user: result.user });
    }),
  );

  router.post(
    "/login",
    validateBody(loginSchema),
    asyncHandler(async (request, response) => {
      const result = await dependencies.authService.login(request.body, getRequestMeta(request));
      setAuthCookies(response, dependencies.config, result);
      response.json({ user: result.user });
    }),
  );

  router.post(
    "/refresh",
    asyncHandler(async (request, response) => {
      const refreshToken = request.cookies?.[authCookieNames.refreshToken];

      if (!refreshToken) {
        throw new AppError(401, "Refresh token is missing.", "REFRESH_TOKEN_MISSING");
      }

      const result = await dependencies.authService.refresh(refreshToken, getRequestMeta(request));
      setAuthCookies(response, dependencies.config, result);
      response.json({ user: result.user });
    }),
  );

  router.post(
    "/logout",
    asyncHandler(async (request, response) => {
      await dependencies.authService.logout(request.cookies?.[authCookieNames.refreshToken]);
      clearAuthCookies(response, dependencies.config);
      response.status(204).send();
    }),
  );

  router.get(
    "/me",
    requireAuth(dependencies.tokenService),
    asyncHandler(async (request, response) => {
      if (!request.user) {
        throw new AppError(401, "Authentication required.", "AUTH_REQUIRED");
      }

      const user = await dependencies.authService.getMe(request.user.id);
      response.json({ user });
    }),
  );

  return router;
}

function getRequestMeta(request: { ip?: string; header(name: string): string | undefined }) {
  return {
    ipAddress: request.ip,
    userAgent: request.header("user-agent"),
  };
}

