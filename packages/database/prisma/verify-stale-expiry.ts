import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import type { PrismaClient as WorkspacePrismaClient } from "@ai-job-platform/database";
import { runIngestionOnce } from "@ai-job-platform/ingestion";
import { createLogger } from "@ai-job-platform/logger";

const prisma = new PrismaClient();
const rollbackSignal = "ROLLBACK_STALE_EXPIRY_VERIFICATION";

async function main() {
  const logger = createLogger("verify-stale-expiry");

  try {
    await prisma.$transaction(
      async (tx) => {
        const source = await tx.jobSource.findFirstOrThrow({
          where: {
            sourceUrl: "https://api.lever.co/v0/postings/theblockcrypto?mode=json",
          },
        });

        if (!source.companyId) {
          throw new Error("Verification source must have a company.");
        }

        const canonicalUrl = `https://example.com/stale-expiry-verification/${randomUUID()}`;

        await tx.jobSource.updateMany({
          where: {
            id: {
              not: source.id,
            },
          },
          data: {
            status: "PAUSED",
          },
        });

        await tx.job.create({
          data: {
            id: randomUUID(),
            companyId: source.companyId,
            sourceId: source.id,
            externalJobId: `stale-expiry-verification-${randomUUID()}`,
            canonicalUrl,
            applyUrl: canonicalUrl,
            title: "Stale Expiry Verification Job",
            normalizedTitle: "stale expiry verification job",
            description: "Temporary row created inside a rolled-back verification transaction.",
            employmentType: "UNKNOWN",
            experienceLevel: "UNKNOWN",
            country: "India",
            isRemote: true,
            isHybrid: false,
            firstSeenAt: subtractDays(new Date(), 45),
            lastSeenAt: subtractDays(new Date(), 45),
            status: "ACTIVE",
            metadata: {
              verificationOnly: true,
            },
          },
        });

        const summary = await runIngestionOnce(tx as unknown as WorkspacePrismaClient, logger, {
          staleJobExpiryDays: 14,
        });

        const verifiedJob = await tx.job.findUniqueOrThrow({
          where: {
            canonicalUrl,
          },
          select: {
            status: true,
            expiresAt: true,
          },
        });

        console.log(
          JSON.stringify(
            {
              summary,
              verifiedJob,
            },
            null,
            2,
          ),
        );

        if (summary.jobsExpired < 1 || verifiedJob.status !== "EXPIRED" || !verifiedJob.expiresAt) {
          throw new Error("Stale expiry verification failed.");
        }

        throw new Error(rollbackSignal);
      },
      {
        maxWait: 10_000,
        timeout: 120_000,
      },
    );
  } catch (error) {
    if (error instanceof Error && error.message === rollbackSignal) {
      return;
    }

    throw error;
  }
}

function subtractDays(value: Date, days: number): Date {
  const result = new Date(value);
  result.setUTCDate(result.getUTCDate() - days);
  return result;
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
