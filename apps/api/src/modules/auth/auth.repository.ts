import type { PrismaClient } from "@ai-job-platform/database";

export class AuthRepository {
  constructor(private readonly db: PrismaClient) {}

  findUserByEmail(email: string) {
    return this.db.user.findUnique({ where: { email } });
  }

  findUserById(id: string) {
    return this.db.user.findUnique({ where: { id } });
  }

  createUser(input: { email: string; passwordHash: string; fullName?: string }) {
    return this.db.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        provider: "EMAIL",
        profile: input.fullName
          ? {
              create: {
                fullName: input.fullName,
                country: "India",
              },
            }
          : undefined,
      },
    });
  }

  createSession(input: {
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.db.session.create({
      data: {
        userId: input.userId,
        refreshTokenHash: input.refreshTokenHash,
        expiresAt: input.expiresAt,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  }

  findActiveSessionByHash(refreshTokenHash: string) {
    return this.db.session.findUnique({
      where: { refreshTokenHash },
      include: { user: true },
    });
  }

  async rotateSession(input: {
    sessionId: string;
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.db.$transaction(async (transaction) => {
      await transaction.session.update({
        where: { id: input.sessionId },
        data: { revokedAt: new Date() },
      });

      return transaction.session.create({
        data: {
          userId: input.userId,
          refreshTokenHash: input.refreshTokenHash,
          expiresAt: input.expiresAt,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        },
      });
    });
  }

  revokeSessionByHash(refreshTokenHash: string) {
    return this.db.session.updateMany({
      where: {
        refreshTokenHash,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  toPublicUser(user: PublicUserInput) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    };
  }
}

interface PublicUserInput {
  readonly id: string;
  readonly email: string;
  readonly role: "USER" | "ADMIN";
  readonly status: string;
  readonly createdAt: Date;
}
