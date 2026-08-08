import type { EmploymentType, ExperienceLevel, NormalizedJobPosting, RawJobPosting } from "../types";

const locationAliases: Record<string, { city: string; state: string }> = {
  bangalore: { city: "Bengaluru", state: "Karnataka" },
  bengaluru: { city: "Bengaluru", state: "Karnataka" },
  gurgaon: { city: "Gurugram", state: "Haryana" },
  gurugram: { city: "Gurugram", state: "Haryana" },
  mumbai: { city: "Mumbai", state: "Maharashtra" },
  pune: { city: "Pune", state: "Maharashtra" },
  hyderabad: { city: "Hyderabad", state: "Telangana" },
  chennai: { city: "Chennai", state: "Tamil Nadu" },
  delhi: { city: "Delhi", state: "Delhi" },
  noida: { city: "Noida", state: "Uttar Pradesh" },
};

export function normalizeJob(raw: RawJobPosting): NormalizedJobPosting {
  const description = normalizeDescription(raw.description ?? "");
  const title = normalizeWhitespace(raw.title);
  const location = normalizeLocation(raw.location);
  const remoteFlags = detectRemoteFlags(`${title} ${description} ${raw.location ?? ""}`);
  const employmentType = detectEmploymentType(title, description, raw.metadata);
  const experience = detectExperience(title, description, employmentType);
  const earlyCareer = detectEarlyCareer(title, description, employmentType, experience.level);

  return {
    sourceType: raw.sourceType,
    sourceUrl: raw.sourceUrl,
    externalJobId: raw.externalJobId,
    companyName: normalizeWhitespace(raw.companyName ?? "Unknown Company"),
    title,
    normalizedTitle: title.toLowerCase(),
    description,
    applyUrl: raw.applyUrl,
    canonicalUrl: raw.canonicalUrl ?? raw.applyUrl,
    locationCity: location?.city,
    locationState: location?.state,
    country: "India",
    isRemote: remoteFlags.isRemote,
    isHybrid: remoteFlags.isHybrid,
    employmentType,
    experienceLevel: experience.level,
    minExperience: experience.min,
    maxExperience: experience.max,
    salaryCurrency: "INR",
    postedAt: raw.postedAt,
    contentHashInput: `${raw.companyName ?? ""}|${title}|${raw.applyUrl}|${description.slice(0, 500)}`,
    metadata: {
      ...raw.metadata,
      earlyCareer,
    },
  };
}

export function normalizeDescription(value: string): string {
  return normalizeWhitespace(stripHtml(decodeHtmlEntitiesDeep(value)));
}

function normalizeWhitespace(value: string): string {
  return decodeHtmlEntitiesDeep(value).replace(/\s+/g, " ").trim();
}

function stripHtml(value: string): string {
  return value
    .replace(/<\s*(br|\/p|\/li|\/h[1-6]|\/div)\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code: string) => {
    const lowerCode = code.toLowerCase();

    if (lowerCode.startsWith("#x")) {
      return decodeCodePoint(Number.parseInt(lowerCode.slice(2), 16), entity);
    }

    if (lowerCode.startsWith("#")) {
      return decodeCodePoint(Number.parseInt(lowerCode.slice(1), 10), entity);
    }

    const namedEntities: Record<string, string> = {
      amp: "&",
      apos: "'",
      gt: ">",
      lt: "<",
      nbsp: " ",
      quot: "\"",
    };

    return namedEntities[lowerCode] ?? entity;
  });
}

function decodeHtmlEntitiesDeep(value: string): string {
  let decoded = value;

  for (let index = 0; index < 3; index += 1) {
    const next = decodeHtmlEntities(decoded);

    if (next === decoded) {
      return next;
    }

    decoded = next;
  }

  return decoded;
}

function decodeCodePoint(codePoint: number, fallback: string): string {
  if (!Number.isFinite(codePoint)) {
    return fallback;
  }

  try {
    return String.fromCodePoint(codePoint);
  } catch {
    return fallback;
  }
}

function normalizeLocation(value?: string): { city: string; state: string } | undefined {
  if (!value) {
    return undefined;
  }

  const lower = value.toLowerCase();

  for (const [alias, location] of Object.entries(locationAliases)) {
    if (lower.includes(alias)) {
      return location;
    }
  }

  return undefined;
}

function detectRemoteFlags(value: string): { isRemote: boolean; isHybrid: boolean } {
  const lower = value.toLowerCase();

  return {
    isRemote: lower.includes("remote") || lower.includes("work from home") || lower.includes("wfh"),
    isHybrid: lower.includes("hybrid"),
  };
}

function detectEmploymentType(title: string, description: string, metadata?: Record<string, unknown>): EmploymentType {
  const lowerTitle = normalizeForDetection(title);
  const lowerMetadata = normalizeForDetection(JSON.stringify(metadata ?? {}));
  const lower = normalizeForDetection(`${title} ${description}`);

  if (hasInternshipSignal(lowerTitle) || /\binternship\b/.test(lowerMetadata)) return "INTERNSHIP";
  if (/\bcontract\b/.test(lower)) return "CONTRACT";
  if (/\bpart[\s-]?time\b/.test(lower)) return "PART_TIME";
  if (/\bfreelance\b/.test(lower)) return "FREELANCE";
  if (/\bfull[\s-]?time\b/.test(lower)) return "FULL_TIME";

  return "UNKNOWN";
}

function detectExperience(
  title: string,
  description: string,
  employmentType: EmploymentType,
): { level: ExperienceLevel; min?: number; max?: number } {
  const lowerTitle = normalizeForDetection(title);
  const lower = normalizeForDetection(`${title} ${description}`);
  const rangeMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:years|yrs|yr|y)/);
  const plusMatch = lower.match(/(\d+(?:\.\d+)?)\s*\+\s*(?:years|yrs|yr|y)/);

  if (employmentType === "INTERNSHIP" || hasEntryTitleSignal(lowerTitle)) {
    return { level: "ENTRY", min: 0, max: 1 };
  }

  if (/\bfreshers?\b|\bfresh graduates?\b|\bno prior (professional )?experience\b/.test(lower)) {
    return { level: "ENTRY", min: 0, max: 1 };
  }

  if (rangeMatch?.[1] && rangeMatch[2]) {
    const min = Number(rangeMatch[1]);
    const max = Number(rangeMatch[2]);
    return { level: levelFromExperienceRange(min, max), min, max };
  }

  if (plusMatch?.[1]) {
    const min = Number(plusMatch[1]);
    return { level: levelFromYears(min), min };
  }

  return { level: "UNKNOWN" };
}

function detectEarlyCareer(
  title: string,
  description: string,
  employmentType: EmploymentType,
  experienceLevel: ExperienceLevel,
): { score: number; signals: string[]; priority: "HIGH" | "MEDIUM" | "LOW" } {
  const lowerTitle = normalizeForDetection(title);
  const lower = normalizeForDetection(`${title} ${description}`);
  const signals = new Set<string>();
  const isSeniorTitle = hasSeniorTitleSignal(lowerTitle) && !hasInternshipSignal(lowerTitle) && !hasEntryTitleSignal(lowerTitle);

  if (employmentType === "INTERNSHIP") signals.add("internship");
  if (experienceLevel === "ENTRY") signals.add("entry-level");
  if (experienceLevel === "JUNIOR") signals.add("junior");
  if (hasInternshipSignal(lowerTitle)) signals.add("internship-title");
  if (hasEntryTitleSignal(lowerTitle)) signals.add("entry-title");
  if (/\b0\s*(?:-|to)\s*(?:1|2)\s*(?:years|yrs|yr|y)\b/.test(lower)) signals.add("0-2-years");
  if (/\bfreshers?\b|\bfresh graduates?\b|\bno prior (professional )?experience\b/.test(lower)) signals.add("fresher-friendly");
  if (/\bcollege students?\b|\bstudents?\s+graduating\b|\b202[6-9]\s+graduates?\b/.test(lower)) signals.add("student-friendly");

  const rawScore = Array.from(signals).reduce((score, signal) => {
    if (signal.includes("internship")) return score + 4;
    if (signal.includes("fresher") || signal.includes("0-2")) return score + 3;
    return score + 2;
  }, 0);
  const score = isSeniorTitle ? Math.min(rawScore, 2) : rawScore;

  return {
    score,
    signals: Array.from(signals),
    priority: score >= 6 ? "HIGH" : score >= 3 ? "MEDIUM" : "LOW",
  };
}

function levelFromExperienceRange(min: number, max: number): ExperienceLevel {
  if (min <= 0 && max <= 2) return "ENTRY";
  if (min <= 1 && max <= 3) return "JUNIOR";
  return levelFromYears(max);
}

function levelFromYears(years: number): ExperienceLevel {
  if (years <= 1) return "ENTRY";
  if (years <= 3) return "JUNIOR";
  if (years <= 6) return "MID";
  if (years <= 10) return "SENIOR";
  return "LEAD";
}

function normalizeForDetection(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9.+#\s-]+/g, " ").replace(/\s+/g, " ").trim();
}

function hasInternshipSignal(value: string) {
  return /\b(intern|internship|apprentice|apprenticeship)\b/.test(value);
}

function hasEntryTitleSignal(value: string) {
  return /\b(fresher|fresh graduate|new grad|new graduate|graduate engineer trainee|management trainee|trainee|campus hire|entry level|software engineer i|associate software engineer|junior)\b/.test(
    value,
  );
}

function hasSeniorTitleSignal(value: string) {
  return /\b(senior|sr|staff|principal|lead|manager|architect|director|head|vp)\b/.test(value);
}
