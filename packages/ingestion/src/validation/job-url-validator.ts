export interface UrlValidationResult {
  readonly url: string;
  readonly valid: boolean;
  readonly statusCode?: number;
  readonly reason?: string;
}

export interface JobUrlValidationResult {
  readonly valid: boolean;
  readonly canonicalUrl: UrlValidationResult;
  readonly applyUrl?: UrlValidationResult;
}

interface UrlValidationOptions {
  readonly timeoutMs?: number;
}

const defaultTimeoutMs = 8_000;
const allowedProtocols = new Set(["http:", "https:"]);

export async function validateJobUrls(
  canonicalUrl: string,
  applyUrl?: string,
  options: UrlValidationOptions = {},
): Promise<JobUrlValidationResult> {
  const canonicalResult = await validateUrl(canonicalUrl, options);

  if (!canonicalResult.valid) {
    return {
      valid: false,
      canonicalUrl: canonicalResult,
    };
  }

  if (!applyUrl || applyUrl === canonicalUrl) {
    return {
      valid: true,
      canonicalUrl: canonicalResult,
    };
  }

  const applyResult = await validateUrl(applyUrl, options);

  return {
    valid: applyResult.valid,
    canonicalUrl: canonicalResult,
    applyUrl: applyResult,
  };
}

async function validateUrl(url: string, options: UrlValidationOptions): Promise<UrlValidationResult> {
  const parsed = parseHttpUrl(url);

  if (!parsed) {
    return {
      url,
      valid: false,
      reason: "INVALID_URL",
    };
  }

  const headResult = await requestUrl(parsed.toString(), "HEAD", options.timeoutMs ?? defaultTimeoutMs);

  if (isConclusive(headResult)) {
    return headResult;
  }

  return requestUrl(parsed.toString(), "GET", options.timeoutMs ?? defaultTimeoutMs);
}

function parseHttpUrl(url: string): URL | undefined {
  try {
    const parsed = new URL(url);
    return allowedProtocols.has(parsed.protocol) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

async function requestUrl(url: string, method: "GET" | "HEAD", timeoutMs: number): Promise<UrlValidationResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "AIJobPlatformBot/0.1 (+job-link-validation)",
        accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
      },
    });

    return {
      url,
      valid: isAcceptableStatus(response.status),
      statusCode: response.status,
      reason: isAcceptableStatus(response.status) ? undefined : statusReason(response.status),
    };
  } catch (error) {
    return {
      url,
      valid: false,
      reason: error instanceof Error && error.name === "AbortError" ? "TIMEOUT" : "FETCH_FAILED",
    };
  } finally {
    clearTimeout(timeout);
  }
}

function isConclusive(result: UrlValidationResult): boolean {
  return result.valid || result.statusCode === 404 || result.statusCode === 410 || result.reason === "INVALID_URL";
}

function isAcceptableStatus(statusCode: number): boolean {
  return statusCode >= 200 && statusCode < 400;
}

function statusReason(statusCode: number): string {
  if (statusCode === 404) return "NOT_FOUND";
  if (statusCode === 410) return "GONE";
  if (statusCode >= 500) return "SERVER_ERROR";
  return `HTTP_${statusCode}`;
}
