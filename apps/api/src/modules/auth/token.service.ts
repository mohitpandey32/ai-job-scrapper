import { randomBytes, randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import type { AppConfig } from "@ai-job-platform/config";
import { AppError } from "../../common/errors/app-error";

export interface TokenUser {
  readonly userId: string;
  readonly email: string;
  readonly role: "USER" | "ADMIN";
}

export interface AccessTokenPayload extends TokenUser {
  readonly tokenType: "access";
}

export interface RefreshTokenPayload extends TokenUser {
  readonly tokenType: "refresh";
  readonly sessionId: string;
}

export class TokenService {
  private readonly accessSecret: Uint8Array;
  private readonly refreshSecret: Uint8Array;

  constructor(private readonly config: AppConfig) {
    this.accessSecret = new TextEncoder().encode(config.jwtAccessTokenSecret);
    this.refreshSecret = new TextEncoder().encode(config.jwtRefreshTokenSecret);
  }

  async createAccessToken(user: TokenUser): Promise<string> {
    return new SignJWT({
      tokenType: "access",
      userId: user.userId,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.userId)
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(this.accessSecret);
  }

  async createRefreshToken(user: TokenUser, sessionId: string): Promise<string> {
    return new SignJWT({
      tokenType: "refresh",
      userId: user.userId,
      email: user.email,
      role: user.role,
      sessionId,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.userId)
      .setJti(randomUUID())
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(this.refreshSecret);
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    const { payload } = await jwtVerify(token, this.accessSecret);

    if (payload.tokenType !== "access") {
      throw new AppError(401, "Invalid access token.", "INVALID_ACCESS_TOKEN");
    }

    return payload as unknown as AccessTokenPayload;
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    const { payload } = await jwtVerify(token, this.refreshSecret);

    if (payload.tokenType !== "refresh") {
      throw new AppError(401, "Invalid refresh token.", "INVALID_REFRESH_TOKEN");
    }

    return payload as unknown as RefreshTokenPayload;
  }

  createCsrfToken(): string {
    return randomBytes(32).toString("hex");
  }
}

