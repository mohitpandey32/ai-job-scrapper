import type { NormalizedJobPosting } from "../types";

export interface DeduplicationFingerprint {
  readonly exactSourceKey?: string;
  readonly canonicalUrl?: string;
  readonly applyUrl: string;
  readonly contentKey: string;
  readonly fuzzyKey: string;
}

export function createDeduplicationFingerprint(job: NormalizedJobPosting): DeduplicationFingerprint {
  return {
    exactSourceKey: job.externalJobId ? `${job.sourceType}:${job.externalJobId}` : undefined,
    canonicalUrl: job.canonicalUrl,
    applyUrl: normalizeUrl(job.applyUrl),
    contentKey: normalizeText(job.contentHashInput),
    fuzzyKey: normalizeText([
      job.companyName,
      job.normalizedTitle,
      job.locationCity ?? "",
      job.locationState ?? "",
    ].join("|")),
  };
}

function normalizeUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";
    url.searchParams.sort();
    return url.toString();
  } catch {
    return value.trim().toLowerCase();
  }
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

