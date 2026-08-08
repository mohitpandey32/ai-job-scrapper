import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const jobs = await prisma.job.findMany({
    select: {
      id: true,
      description: true,
    },
  });

  let updated = 0;

  for (const job of jobs) {
    const description = cleanDescription(job.description);

    if (description !== job.description) {
      await prisma.job.update({
        where: { id: job.id },
        data: { description },
      });
      updated += 1;
    }
  }

  console.log(JSON.stringify({ checked: jobs.length, updated }, null, 2));
}

function cleanDescription(value: string): string {
  return decodeHtmlEntitiesDeep(value)
    .replace(/<\s*(br|\/p|\/li|\/h[1-6]|\/div)\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code: string) => {
    const lowerCode = code.toLowerCase();

    if (lowerCode.startsWith("#x")) {
      return decodeCodePoint(Number.parseInt(lowerCode.slice(2), 16), entity);
    }

    if (lowerCode.startsWith("#")) {
      return decodeCodePoint(Number.parseInt(lowerCode.slice(1), 10), entity);
    }

    const namedEntities: Record<string, string> = {
      amp: "&",
      apos: "'",
      gt: ">",
      lt: "<",
      nbsp: " ",
      quot: "\"",
    };

    return namedEntities[lowerCode] ?? entity;
  });
}

function decodeHtmlEntitiesDeep(value: string): string {
  let decoded = value;

  for (let index = 0; index < 3; index += 1) {
    const next = decodeHtmlEntities(decoded);

    if (next === decoded) {
      return next;
    }

    decoded = next;
  }

  return decoded;
}

function decodeCodePoint(codePoint: number, fallback: string): string {
  if (!Number.isFinite(codePoint)) {
    return fallback;
  }

  try {
    return String.fromCodePoint(codePoint);
  } catch {
    return fallback;
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
