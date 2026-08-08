import type { JobSourceAdapter, RawJobPosting, SourceConfig } from "../../types";

interface AshbyJob {
  id: string;
  title: string;
  jobUrl: string;
  applyUrl?: string;
  locationName?: string;
  descriptionHtml?: string;
  departmentName?: string;
  publishedAt?: string;
}

interface AshbyResponse {
  jobs?: AshbyJob[];
}

export class AshbyAdapter implements JobSourceAdapter {
  readonly sourceType = "ASHBY" as const;

  canHandle(source: SourceConfig): boolean {
    return source.sourceType === this.sourceType;
  }

  async fetchJobs(source: SourceConfig): Promise<RawJobPosting[]> {
    const response = await fetch(source.sourceUrl, {
      headers: {
        accept: "application/json",
      },
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      throw new Error(`Ashby fetch failed with status ${response.status}`);
    }

    const payload = (await response.json()) as AshbyResponse;
    const jobs = payload.jobs ?? [];

    return jobs.map((job) => ({
      sourceType: this.sourceType,
      sourceUrl: source.sourceUrl,
      externalJobId: job.id,
      title: job.title,
      companyName: source.name,
      description: stripHtml(job.descriptionHtml ?? ""),
      applyUrl: job.applyUrl ?? job.jobUrl,
      canonicalUrl: job.jobUrl,
      location: job.locationName,
      postedAt: job.publishedAt,
      metadata: {
        departmentName: job.departmentName,
      },
    }));
  }
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

