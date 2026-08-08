import { randomUUID } from "node:crypto";
import { AppError } from "../../common/errors/app-error";
import type { AuthRepository } from "./auth.repository";
import type { LoginInput, SignupInput } from "./auth.schemas";
import type { PasswordService } from "./password.service";
import { hashSessionToken } from "./session-token";
import type { TokenService, TokenUser } from "./token.service";

const refreshTokenTtlMs = 30 * 24 * 60 * 60 * 1000;

export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  async signup(input: SignupInput, requestMeta: RequestMeta) {
    const existingUser = await this.authRepository.findUserByEmail(input.email);

    if (existingUser) {
      throw new AppError(409, "Email is already registered.", "EMAIL_ALREADY_REGISTERED");
    }

    const passwordHash = await this.passwordService.hash(input.password);
    const user = await this.authRepository.createUser({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
    });

    return this.createSessionResponse(user, requestMeta);
  }

  async login(input: LoginInput, requestMeta: RequestMeta) {
    const user = await this.authRepository.findUserByEmail(input.email);

    if (!user || !user.passwordHash) {
      throw new AppError(401, "Invalid email or password.", "INVALID_CREDENTIALS");
    }

    const isValidPassword = await this.passwordService.verify(input.password, user.passwordHash);

    if (!isValidPassword) {
      throw new AppError(401, "Invalid email or password.", "INVALID_CREDENTIALS");
    }

    if (user.status !== "ACTIVE") {
      throw new AppError(403, "Account is not active.", "ACCOUNT_NOT_ACTIVE");
    }

    return this.createSessionResponse(user, requestMeta);
  }

  async refresh(refreshToken: string, requestMeta: RequestMeta) {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);
    const refreshTokenHash = hashSessionToken(refreshToken);
    const session = await this.authRepository.findActiveSessionByHash(refreshTokenHash);

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new AppError(401, "Refresh session is invalid.", "INVALID_REFRESH_SESSION");
    }

    if (session.id !== payload.sessionId || session.userId !== payload.userId) {
      throw new AppError(401, "Refresh session mismatch.", "REFRESH_SESSION_MISMATCH");
    }

    const tokenUser = this.toTokenUser(session.user);
    const newSessionId = randomUUID();
    const newRefreshToken = await this.tokenService.createRefreshToken(tokenUser, newSessionId);
    const newRefreshTokenHash = hashSessionToken(newRefreshToken);

    await this.authRepository.rotateSession({
      sessionId: session.id,
      userId: session.userId,
      refreshTokenHash: newRefreshTokenHash,
      expiresAt: new Date(Date.now() + refreshTokenTtlMs),
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
    });

    return {
      user: this.authRepository.toPublicUser(session.user),
      accessToken: await this.tokenService.createAccessToken(tokenUser),
      refreshToken: newRefreshToken,
      csrfToken: this.tokenService.createCsrfToken(),
    };
  }

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) {
      return;
    }

    await this.authRepository.revokeSessionByHash(hashSessionToken(refreshToken));
  }

  async getMe(userId: string) {
    const user = await this.authRepository.findUserById(userId);

    if (!user) {
      throw new AppError(404, "User not found.", "USER_NOT_FOUND");
    }

    return this.authRepository.toPublicUser(user);
  }

  private async createSessionResponse(user: TokenUserInput, requestMeta: RequestMeta) {
    const tokenUser = this.toTokenUser(user);
    const sessionId = randomUUID();
    const refreshToken = await this.tokenService.createRefreshToken(tokenUser, sessionId);

    await this.authRepository.createSession({
      userId: user.id,
      refreshTokenHash: hashSessionToken(refreshToken),
      expiresAt: new Date(Date.now() + refreshTokenTtlMs),
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
    });

    return {
      user: this.authRepository.toPublicUser(user),
      accessToken: await this.tokenService.createAccessToken(tokenUser),
      refreshToken,
      csrfToken: this.tokenService.createCsrfToken(),
    };
  }

  private toTokenUser(user: TokenUserInput): TokenUser {
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  }
}

interface RequestMeta {
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

interface TokenUserInput {
  readonly id: string;
  readonly email: string;
  readonly role: "USER" | "ADMIN";
  readonly status: string;
  readonly createdAt: Date;
}
