import { Router } from "express";
import multer from "multer";
import { AppError } from "../../common/errors/app-error";
import { asyncHandler } from "../../common/http/async-handler";
import type { ResumeService } from "./resume.service";

const maxResumeSizeBytes = 5 * 1024 * 1024;
const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxResumeSizeBytes,
    files: 1,
  },
  fileFilter: (_request, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new AppError(400, "Upload a PDF, DOCX, or TXT resume.", "UNSUPPORTED_RESUME_TYPE"));
      return;
    }

    callback(null, true);
  },
});

export function createResumeRouter(service: ResumeService) {
  const router = Router();

  router.get(
    "/latest",
    asyncHandler(async (request, response) => {
      if (!request.user) {
        throw new AppError(401, "Authentication required.", "AUTH_REQUIRED");
      }

      const resume = await service.latest(request.user.id);
      response.json({ resume: resume ? serializeResume(resume) : null });
    }),
  );

  router.post(
    "/upload",
    upload.single("resume"),
    asyncHandler(async (request, response) => {
      if (!request.user) {
        throw new AppError(401, "Authentication required.", "AUTH_REQUIRED");
      }

      if (!request.file) {
        throw new AppError(400, "Resume file is required.", "RESUME_FILE_REQUIRED");
      }

      const result = await service.uploadAndAnalyze(request.user.id, request.file);
      response.status(201).json({
        resume: serializeResume(result.resume, result.analysis),
        parseError: result.parseError,
      });
    }),
  );

  return router;
}

type ResumeWithAnalysis = Awaited<ReturnType<ResumeService["latest"]>>;
type ResumeRecord = NonNullable<ResumeWithAnalysis>;
type AnalysisRecord = ResumeRecord["analyses"][number];

function serializeResume(resume: ResumeRecord | Omit<ResumeRecord, "analyses">, analysis?: AnalysisRecord | null) {
  const latestAnalysis = "analyses" in resume ? resume.analyses[0] : analysis;

  return {
    id: resume.id,
    fileName: resume.fileName,
    fileType: resume.fileType,
    fileSize: resume.fileSize,
    parseStatus: resume.parseStatus,
    uploadedAt: resume.uploadedAt,
    analysis: latestAnalysis
      ? {
          id: latestAnalysis.id,
          summary: latestAnalysis.experienceSummary,
          skills: latestAnalysis.skills,
          strengths: latestAnalysis.strengths,
          gaps: latestAnalysis.gaps,
          ...extractAnalysisMetadata(latestAnalysis.parsedJson),
          createdAt: latestAnalysis.createdAt,
        }
      : null,
  };
}

function extractAnalysisMetadata(value: unknown) {
  if (!isRecord(value)) {
    return {
      atsScore: null,
      targetRoles: [],
      experienceLevel: "UNKNOWN",
      recommendedKeywords: [],
      improvementSuggestions: [],
      fallbackUsed: false,
    };
  }

  return {
    atsScore: typeof value.atsScore === "number" ? value.atsScore : null,
    targetRoles: getStringArray(value.targetRoles),
    experienceLevel: typeof value.experienceLevel === "string" ? value.experienceLevel : "UNKNOWN",
    recommendedKeywords: getStringArray(value.recommendedKeywords),
    improvementSuggestions: getStringArray(value.improvementSuggestions),
    fallbackUsed: value.fallbackUsed === true,
  };
}

function getStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
