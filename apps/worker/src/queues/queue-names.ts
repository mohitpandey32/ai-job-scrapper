export const queueNames = {
  ingestion: "ingestion",
  resumeAnalysis: "resume-analysis",
  searchIndexing: "search-indexing",
} as const;

export type QueueName = (typeof queueNames)[keyof typeof queueNames];

