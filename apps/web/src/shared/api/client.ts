const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";
const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
let csrfTokenCache: string | undefined;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = options.method?.toUpperCase() ?? "GET";
  const headers = new Headers(options.headers);
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (options.body && !headers.has("content-type") && !isFormData) {
    headers.set("content-type", "application/json");
  }

  if (unsafeMethods.has(method)) {
    const csrfToken = csrfTokenCache ?? readCookie("csrf_token");
    if (csrfToken) {
      headers.set("x-csrf-token", csrfToken);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    method,
    headers,
    credentials: "include",
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json().catch(() => undefined);

  if (!response.ok) {
    const error = payload?.error;
    throw new ApiError(response.status, error?.message ?? "Request failed.", error?.code ?? "API_ERROR", error?.details);
  }

  return payload as T;
}

export function setCsrfToken(token: string) {
  csrfTokenCache = token;
}

export function clearCsrfToken() {
  csrfTokenCache = undefined;
}

function readCookie(name: string) {
  const prefix = `${name}=`;
  const cookie = document.cookie.split("; ").find((entry) => entry.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : undefined;
}
