import { apiRequest } from "./client";

export interface PublicUser {
  readonly id: string;
  readonly email: string;
  readonly role: "USER" | "ADMIN";
  readonly status: string;
  readonly createdAt: string;
}

export interface AuthResponse {
  readonly user: PublicUser;
}

export function getCsrfToken() {
  return apiRequest<{ csrfToken: string }>("/api/v1/auth/csrf");
}

export function signup(input: { email: string; password: string; fullName?: string }) {
  return apiRequest<AuthResponse>("/api/v1/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function login(input: { email: string; password: string }) {
  return apiRequest<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logout() {
  return apiRequest<void>("/api/v1/auth/logout", {
    method: "POST",
  });
}

export function getMe() {
  return apiRequest<AuthResponse>("/api/v1/auth/me");
}

