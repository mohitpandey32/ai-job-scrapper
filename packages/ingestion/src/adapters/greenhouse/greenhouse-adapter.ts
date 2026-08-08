import type { JobSourceAdapter, RawJobPosting, SourceConfig } from "../../types";

interface GreenhouseJob {
  id: number;
  title: string;
  absolute_url: string;
  location?: {
    name?: string;
  };
  content?: string;
  updated_at?: string;
  metadata?: unknown;
}

interface GreenhouseResponse {
  jobs?: GreenhouseJob[];
}

export class GreenhouseAdapter implements JobSourceAdapter {
  readonly sourceType = "GREENHOUSE" as const;

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
      throw new Error(`Greenhouse fetch failed with status ${response.status}`);
    }

    const payload = (await response.json()) as GreenhouseResponse;
    const jobs = payload.jobs ?? [];

    return jobs.map((job) => ({
      sourceType: this.sourceType,
      sourceUrl: source.sourceUrl,
      externalJobId: String(job.id),
      title: job.title,
      companyName: source.name,
      description: job.content,
      applyUrl: job.absolute_url,
      canonicalUrl: job.absolute_url,
      location: job.location?.name,
      postedAt: job.updated_at,
      metadata: {
        greenhouse: job.metadata,
      },
    }));
  }
}

