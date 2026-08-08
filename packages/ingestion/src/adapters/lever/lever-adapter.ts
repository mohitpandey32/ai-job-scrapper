import type { JobSourceAdapter, RawJobPosting, SourceConfig } from "../../types";

interface LeverPosting {
  id: string;
  text: string;
  hostedUrl: string;
  applyUrl?: string;
  categories?: {
    location?: string;
    allLocations?: string[];
    commitment?: string;
    team?: string;
  };
  descriptionPlain?: string;
  additionalPlain?: string;
  createdAt?: number;
}

export class LeverAdapter implements JobSourceAdapter {
  readonly sourceType = "LEVER" as const;

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
      throw new Error(`Lever fetch failed with status ${response.status}`);
    }

    const postings = (await response.json()) as LeverPosting[];

    return postings.map((posting) => ({
      sourceType: this.sourceType,
      sourceUrl: source.sourceUrl,
      externalJobId: posting.id,
      title: posting.text,
      companyName: source.name,
      description: [posting.descriptionPlain, posting.additionalPlain].filter(Boolean).join("\n\n"),
      applyUrl: posting.applyUrl ?? posting.hostedUrl,
      canonicalUrl: posting.hostedUrl,
      location: posting.categories?.allLocations?.length
        ? posting.categories.allLocations.join(" / ")
        : posting.categories?.location,
      postedAt: posting.createdAt ? new Date(posting.createdAt).toISOString() : undefined,
      metadata: {
        team: posting.categories?.team,
        commitment: posting.categories?.commitment,
        location: posting.categories?.location,
        allLocations: posting.categories?.allLocations,
      },
    }));
  }
}
