import { createHash, randomUUID } from "node:crypto";
import type { StorageService } from "../../common/storage/storage.service";
import type { ResumeAnalyzer } from "./resume-ai.types";
import type { ResumeRepository } from "./resume.repository";
import { extractResumeText } from "./resume-parser";

export class ResumeService {
  constructor(
    private readonly repository: ResumeRepository,
    private readonly storage: StorageService,
    private readonly resumeAnalyzer: ResumeAnalyzer,
  ) {}

  async uploadAndAnalyze(userId: string, file: Express.Multer.File) {
    const storageKey = `resumes/${userId}/${randomUUID()}-${sanitizeFileName(file.originalname)}`;
    const storedObject = await this.storage.putObject({
      key: storageKey,
      body: file.buffer,
      contentType: file.mimetype,
      contentLength: file.size,
      metadata: {
        userId,
        originalFileName: file.originalname,
      },
    });

    const resume = await this.repository.createResume({
      userId,
      fileUrl: storedObject.uri,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      storageKey: storedObject.key,
      parseStatus: "PROCESSING",
      currentVersion: 1,
    });

    try {
      const extractedText = await extractResumeText(file);
      const analysis = await this.resumeAnalyzer.analyzeResume({ resumeText: extractedText });
      const extractedTextHash = sha256(extractedText);

      const updatedResume = await this.repository.updateResume(resume.id, {
        parseStatus: "COMPLETED",
        extractedTextHash,
      });

      const createdAnalysis = await this.repository.createAnalysis({
        resumeId: resume.id,
        userId,
        modelProvider: analysis.modelProvider,
        modelName: analysis.modelName,
        analysisVersion: 1,
        parsedJson: {
          atsScore: analysis.atsScore,
          targetRoles: analysis.targetRoles,
          experienceLevel: analysis.experienceLevel,
          recommendedKeywords: analysis.recommendedKeywords,
          improvementSuggestions: analysis.improvementSuggestions,
          fallbackUsed: analysis.fallbackUsed ?? false,
          extractedTextPreview: extractedText.slice(0, 1200),
        },
        skills: analysis.detectedSkills,
        experienceSummary: analysis.professionalSummary,
        strengths: analysis.strengths,
        gaps: analysis.gaps,
        riskFlags: [],
        confidenceScore: analysis.confidenceScore,
      });

      return {
        resume: updatedResume,
        analysis: createdAnalysis,
      };
    } catch (error) {
      const updatedResume = await this.repository.updateResume(resume.id, {
        parseStatus: "FAILED",
      });

      return {
        resume: updatedResume,
        analysis: null,
        parseError: error instanceof Error ? error.message : "Resume parsing failed.",
      };
    }
  }

  latest(userId: string) {
    return this.repository.findLatestByUserId(userId);
  }
}

function sanitizeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 120) || "resume";
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
