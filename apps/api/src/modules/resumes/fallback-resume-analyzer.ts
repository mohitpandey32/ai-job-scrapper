import type { AppLogger } from "@ai-job-platform/logger";
import type { ResumeAnalyzer, ResumeAnalyzerInput, ResumeAnalyzerResult } from "./resume-ai.types";

export class FallbackResumeAnalyzer implements ResumeAnalyzer {
  constructor(
    private readonly primary: ResumeAnalyzer,
    private readonly fallback: ResumeAnalyzer,
    private readonly logger: AppLogger,
  ) {}

  async analyzeResume(input: ResumeAnalyzerInput): Promise<ResumeAnalyzerResult> {
    try {
      return await this.primary.analyzeResume(input);
    } catch (error) {
      this.logger.warn(
        {
          error: error instanceof Error ? error.message : "Unknown AI resume analysis error.",
        },
        "Primary resume AI analyzer failed. Falling back to deterministic analyzer.",
      );

      const fallbackResult = await this.fallback.analyzeResume(input);
      return {
        ...fallbackResult,
        fallbackUsed: true,
      };
    }
  }
}
