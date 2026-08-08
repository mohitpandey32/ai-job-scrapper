import type { AppLogger } from "@ai-job-platform/logger";
import type { CoverLetterGenerator, CoverLetterGeneratorInput, CoverLetterGeneratorResult } from "./cover-letter.types";

export class FallbackCoverLetterGenerator implements CoverLetterGenerator {
  constructor(
    private readonly primary: CoverLetterGenerator,
    private readonly fallback: CoverLetterGenerator,
    private readonly logger: AppLogger,
  ) {}

  async generateCoverLetter(input: CoverLetterGeneratorInput): Promise<CoverLetterGeneratorResult> {
    try {
      return await this.primary.generateCoverLetter(input);
    } catch (error) {
      this.logger.warn(
        {
          error: error instanceof Error ? error.message : "Unknown cover letter generation error.",
        },
        "Primary cover letter generator failed. Falling back to deterministic generator.",
      );

      const fallbackResult = await this.fallback.generateCoverLetter(input);
      return {
        ...fallbackResult,
        fallbackUsed: true,
      };
    }
  }
}
