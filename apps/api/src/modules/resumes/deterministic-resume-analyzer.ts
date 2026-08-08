import { analyzeResumeText } from "./resume-analysis";
import type { ResumeAnalyzer, ResumeAnalyzerInput, ResumeAnalyzerResult } from "./resume-ai.types";

export class DeterministicResumeAnalyzer implements ResumeAnalyzer {
  async analyzeResume(input: ResumeAnalyzerInput): Promise<ResumeAnalyzerResult> {
    const analysis = analyzeResumeText(input.resumeText);
    const atsScore = calculateDeterministicAtsScore(analysis.skills.length, analysis.wordCount);

    return {
      professionalSummary: analysis.summary,
      detectedSkills: analysis.skills,
      targetRoles: inferTargetRoles(input.resumeText),
      experienceLevel: inferExperienceLevel(input.resumeText),
      strengths: analysis.strengths,
      gaps: analysis.gaps,
      improvementSuggestions: analysis.gaps.map((gap) => `Improve this resume signal: ${gap}`),
      atsScore,
      recommendedKeywords: analysis.skills.slice(0, 20),
      modelProvider: "deterministic",
      modelName: "keyword-resume-analyzer-v1",
      confidenceScore: 0.65,
    };
  }
}

function calculateDeterministicAtsScore(skillCount: number, wordCount: number) {
  const skillScore = Math.min(45, skillCount * 7);
  const lengthScore = wordCount >= 350 ? 25 : wordCount >= 250 ? 18 : wordCount >= 150 ? 10 : 5;
  return Math.min(82, 25 + skillScore + lengthScore);
}

function inferTargetRoles(text: string) {
  const normalized = text.toLowerCase();
  const roles: string[] = [];

  if (/\breact|frontend|front-end|javascript|typescript\b/.test(normalized)) roles.push("Frontend Developer");
  if (/\bnode\.?js|express|nestjs|backend|api\b/.test(normalized)) roles.push("Backend Developer");
  if (/\bpython|machine learning|data analysis|power bi|tableau\b/.test(normalized)) roles.push("Data Analyst");
  if (/\bsales|customer success|account development\b/.test(normalized)) roles.push("Sales Development Representative");
  if (/\bproduct manager|roadmap|stakeholder\b/.test(normalized)) roles.push("Product Manager");

  return roles.slice(0, 5);
}

function inferExperienceLevel(text: string): ResumeAnalyzerResult["experienceLevel"] {
  const normalized = text.toLowerCase();
  const yearsMatch = normalized.match(/(\d+)\s*(\+)?\s*(years|yrs)/);
  const years = yearsMatch ? Number(yearsMatch[1]) : null;

  if (years !== null) {
    if (years <= 1) return "ENTRY";
    if (years <= 3) return "JUNIOR";
    if (years <= 6) return "MID";
    if (years <= 10) return "SENIOR";
    return "LEAD";
  }

  if (/\bintern|fresher|entry level\b/.test(normalized)) return "ENTRY";
  if (/\bsenior|lead|principal\b/.test(normalized)) return "SENIOR";
  return "UNKNOWN";
}
