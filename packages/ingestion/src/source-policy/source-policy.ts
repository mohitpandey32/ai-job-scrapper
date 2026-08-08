import type { SourceConfig, SourcePolicyDecision } from "../types";

const DEFAULT_ALLOWED_REQUESTS_PER_HOUR = 12;
const ATS_ALLOWED_REQUESTS_PER_HOUR = 24;

const blockedHostnames = new Set([
  "linkedin.com",
  "www.linkedin.com",
]);

export function evaluateSourcePolicy(source: SourceConfig): SourcePolicyDecision {
  const hostname = getHostname(source.sourceUrl);

  if (!source.allowed) {
    return deny(source, "Source is not allowlisted.");
  }

  if (!hostname) {
    return deny(source, "Source URL is invalid.");
  }

  if (blockedHostnames.has(hostname)) {
    return deny(source, "Direct LinkedIn scraping is blocked without permissioned access.");
  }

  if (source.termsReviewStatus === "BLOCKED") {
    return deny(source, "Source terms review is blocked.");
  }

  if (source.riskLevel === "HIGH" && source.termsReviewStatus !== "ALLOWED") {
    return deny(source, "High-risk sources require explicit approval.");
  }

  const isAts = source.sourceType === "GREENHOUSE" || source.sourceType === "LEVER" || source.sourceType === "ASHBY";

  return {
    allowed: true,
    riskLevel: source.riskLevel,
    reason: "Source passed MVP policy checks.",
    maxRequestsPerHour: isAts ? ATS_ALLOWED_REQUESTS_PER_HOUR : DEFAULT_ALLOWED_REQUESTS_PER_HOUR,
    allowBrowserRender: source.sourceType !== "PUBLIC_WEB" && source.riskLevel !== "HIGH",
  };
}

function deny(source: SourceConfig, reason: string): SourcePolicyDecision {
  return {
    allowed: false,
    riskLevel: source.riskLevel,
    reason,
    maxRequestsPerHour: 0,
    allowBrowserRender: false,
  };
}

function getHostname(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

