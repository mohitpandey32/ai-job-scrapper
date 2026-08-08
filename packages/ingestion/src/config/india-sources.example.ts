import type { SourceConfig } from "../types";

export const indiaSourceExamples: SourceConfig[] = [
  {
    name: "Example Greenhouse Company",
    sourceType: "GREENHOUSE",
    sourceUrl: "https://boards-api.greenhouse.io/v1/boards/example/jobs?content=true",
    country: "India",
    riskLevel: "LOW",
    termsReviewStatus: "ALLOWED",
    crawlFrequencyMinutes: 720,
    allowed: false,
    notes: "Replace example with a reviewed Greenhouse board token before enabling.",
  },
  {
    name: "Example Lever Company",
    sourceType: "LEVER",
    sourceUrl: "https://api.lever.co/v0/postings/example?mode=json",
    country: "India",
    riskLevel: "LOW",
    termsReviewStatus: "ALLOWED",
    crawlFrequencyMinutes: 720,
    allowed: false,
    notes: "Replace example with a reviewed Lever company slug before enabling.",
  },
  {
    name: "Example Ashby Company",
    sourceType: "ASHBY",
    sourceUrl: "https://api.ashbyhq.com/posting-api/job-board/example",
    country: "India",
    riskLevel: "LOW",
    termsReviewStatus: "ALLOWED",
    crawlFrequencyMinutes: 720,
    allowed: false,
    notes: "Replace example with a reviewed Ashby organization slug before enabling.",
  },
];

