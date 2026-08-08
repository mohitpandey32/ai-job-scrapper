import type { CoverLetterGenerator, CoverLetterGeneratorInput, CoverLetterGeneratorResult } from "./cover-letter.types";

export class DeterministicCoverLetterGenerator implements CoverLetterGenerator {
  async generateCoverLetter(input: CoverLetterGeneratorInput): Promise<CoverLetterGeneratorResult> {
    const skills = input.candidate.skills.slice(0, 6);
    const strengths = input.candidate.strengths.slice(0, 3);
    const skillSentence = skills.length ? `My background includes ${joinHumanList(skills)}, which aligns with the role requirements.` : "My background aligns with the responsibilities described for this role.";
    const strengthsSentence = strengths.length ? `I would bring ${joinHumanList(strengths.map(lowerFirst))}.` : "I would bring a practical, learning-oriented approach and strong ownership to the role.";

    return {
      subjectLine: `Application for ${input.job.title} at ${input.job.companyName}`,
      coverLetter: [
        `Dear ${input.job.companyName} Hiring Team,`,
        "",
        `I am writing to apply for the ${input.job.title} role at ${input.job.companyName}. ${input.candidate.summary ?? "My resume shows relevant experience and skills for this opportunity."}`,
        "",
        `${skillSentence} ${strengthsSentence} I am especially interested in this opportunity because it would let me contribute to meaningful work while continuing to grow in the areas your team values.`,
        "",
        "Thank you for considering my application. I would welcome the opportunity to discuss how my background can support your team.",
        "",
        "Sincerely,",
      ].join("\n"),
      modelProvider: "deterministic",
      modelName: "template-cover-letter-v1",
    };
  }
}

function joinHumanList(values: readonly string[]) {
  if (values.length <= 1) return values[0] ?? "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
}

function lowerFirst(value: string) {
  return value.charAt(0).toLowerCase() + value.slice(1);
}
