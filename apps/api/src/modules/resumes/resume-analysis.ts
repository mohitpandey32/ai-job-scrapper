export const skillCatalog = [
  "javascript",
  "typescript",
  "react",
  "next.js",
  "node.js",
  "express",
  "nestjs",
  "python",
  "django",
  "fastapi",
  "java",
  "spring boot",
  "sql",
  "postgresql",
  "mysql",
  "mongodb",
  "redis",
  "aws",
  "docker",
  "kubernetes",
  "git",
  "github actions",
  "html",
  "css",
  "tailwind",
  "figma",
  "data analysis",
  "excel",
  "power bi",
  "tableau",
  "machine learning",
  "deep learning",
  "nlp",
  "prompt engineering",
  "sales",
  "customer success",
  "product management",
  "seo",
  "digital marketing",
] as const;

export interface ResumeAnalysisResult {
  readonly summary: string;
  readonly skills: string[];
  readonly strengths: string[];
  readonly gaps: string[];
  readonly wordCount: number;
}

export function analyzeResumeText(text: string): ResumeAnalysisResult {
  const normalized = text.toLowerCase();
  const skills = skillCatalog.filter((skill) => normalized.includes(skill));
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return {
    summary: buildSummary(text, skills, wordCount),
    skills,
    strengths: buildStrengths(normalized, skills, wordCount),
    gaps: buildGaps(skills, wordCount),
    wordCount,
  };
}

function buildSummary(text: string, skills: readonly string[], wordCount: number): string {
  const firstLine = text
    .split(/\n|\.\s/)
    .map((line) => line.trim())
    .find((line) => line.length > 40);

  if (firstLine) {
    return firstLine.slice(0, 260);
  }

  if (skills.length) {
    return `Resume mentions ${skills.slice(0, 6).join(", ")} across ${wordCount} words.`;
  }

  return `Resume parsed successfully with ${wordCount} words. Add clearer skills and project impact for stronger matching.`;
}

function buildStrengths(normalized: string, skills: readonly string[], wordCount: number): string[] {
  const strengths: string[] = [];

  if (skills.length >= 6) strengths.push("Strong number of recognizable skills for initial matching.");
  if (normalized.includes("project")) strengths.push("Mentions project work, useful for role matching.");
  if (normalized.includes("experience")) strengths.push("Includes experience signals.");
  if (/\d+%|\d+\s*(years|yrs|months|users|customers|revenue|sales)/i.test(normalized)) {
    strengths.push("Contains measurable impact or duration signals.");
  }
  if (wordCount >= 350) strengths.push("Resume has enough text for basic parsing and analysis.");

  return strengths.length ? strengths : ["Resume was parsed and is ready for skill matching."];
}

function buildGaps(skills: readonly string[], wordCount: number): string[] {
  const gaps: string[] = [];

  if (skills.length < 4) gaps.push("Add more explicit skills to improve job matching.");
  if (wordCount < 250) gaps.push("Resume text looks short; add project, work, and education details.");
  if (!skills.some((skill) => ["sql", "postgresql", "mysql", "mongodb"].includes(skill))) {
    gaps.push("Add database/tools keywords if relevant to your target roles.");
  }
  if (!skills.some((skill) => ["aws", "docker", "kubernetes", "github actions"].includes(skill))) {
    gaps.push("Add deployment, cloud, or tooling experience if relevant.");
  }

  return gaps;
}
