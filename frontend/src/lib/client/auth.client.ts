"use client";
import { useState, useCallback, useEffect } from "react";
import { dbUrl, jsonFetch } from "../transport/fetcher";

const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";

type AuthUser = { id: string; name: string; workspaceName: string } | null;

export function getToken(): string | null {
  try {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch {}
}

export function removeToken(): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
}

export function getRefreshToken(): string | null {
  try {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setRefreshToken(token: string): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    }
  } catch {}
}

export function removeRefreshToken(): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  } catch {}
}

function base64UrlDecode(str: string) {
  const pad = (s: string) => s + "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = pad(str.replace(/-/g, "+").replace(/_/g, "/"));
  if (typeof window === "undefined") return "";
  try {
    return decodeURIComponent(
      Array.prototype.map
        .call(window.atob(b64), (c: string) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join("")
    );
  } catch {
    return "";
  }
}

export function extractWorkspaceInfoFromToken(token?: string): { workspaceId: string | null; workspaceName: string | null; userName?: string | null } {
  if (!token) return { workspaceId: null, workspaceName: null, userName: null };
  const parts = token.split(".");
  if (parts.length !== 3) return { workspaceId: null, workspaceName: null, userName: null };
  try {
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    const ns = "https://echoboard.app/";
    const id = payload[`${ns}workspace_id`] ?? payload.primary_workspace_id ?? null;
    const name = payload[`${ns}workspace_name`] ?? null;
    const userName = payload.name || payload.username || null;
    return { workspaceId: id, workspaceName: name, userName };
  } catch {
    return { workspaceId: null, workspaceName: null, userName: null };
  }
}

export function buildUnifiedHeaders(additional?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...(additional ?? {}) };
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    const info = extractWorkspaceInfoFromToken(token);
    if (info.workspaceId) headers["X-Workspace-ID"] = info.workspaceId;
  }
  return headers;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser>(null);

  useEffect(() => {
    const token = getToken();
    if (token) {
      const info = extractWorkspaceInfoFromToken(token);
      const userIdentifier = info.userName || "User";
      setUser({ id: userIdentifier, name: info.userName || "User", workspaceName: info.workspaceName || "Default Workspace" });
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (token: string, refreshToken?: string) => {
    setIsLoading(true);
    setToken(token);
    if (refreshToken) setRefreshToken(refreshToken);
    const info = extractWorkspaceInfoFromToken(token);
    const userIdentifier = info.userName || "User";
    setUser({ id: userIdentifier, name: info.userName || "User", workspaceName: info.workspaceName || "Default Workspace" });
    setIsAuthenticated(true);
    setIsLoading(false);
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    const rt = getRefreshToken();
    try {
      await fetch(dbUrl("/api/db/auth/logout"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rt ? { refresh_token: rt } : {}),
        cache: "no-store",
      });
    } catch {}
    removeToken();
    removeRefreshToken();
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
    if (typeof window !== "undefined") window.location.href = "/login";
  }, []);

  return { isAuthenticated, isLoading, user, login, logout };
}

export async function loginLegacy(
  username: string,
  password: string
): Promise<
  | { access_token: string; refresh_token?: string; requires_2fa?: false }
  | { requires_2fa: true; temporary_token: string; message?: string }
> {
  const form = new URLSearchParams();
  form.append("username", username);
  form.append("password", password);
  const data = await jsonFetch<{ access_token?: string; refresh_token?: string; requires_2fa?: boolean; temporary_token?: string; message?: string }>(dbUrl("/api/db/auth/token"), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  if (data?.requires_2fa) {
    return { requires_2fa: true, temporary_token: String(data.temporary_token ?? ""), message: data.message };
  }
  return { access_token: String(data.access_token ?? ""), refresh_token: data.refresh_token, requires_2fa: false };
}

export async function verify2faLegacy(temporaryToken: string, code: string): Promise<{ access_token: string; refresh_token?: string }> {
  const payload = { temporary_token: temporaryToken, verification_code: code };
  return jsonFetch(dbUrl("/api/db/auth/verify-2fa"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function logoutLegacy() {
  const rt = getRefreshToken();
  try {
    await jsonFetch(dbUrl("/api/db/auth/logout"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rt ? { refresh_token: rt } : {}),
    });
  } catch {}
  removeToken();
  removeRefreshToken();
}

// Registration
export async function registerLegacy(payload: { email: string; password: string; firstName: string; lastName: string }) {
  return jsonFetch(dbUrl("/api/db/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// Email verification
export async function verifyEmailLegacy(email: string, code: string) {
  return jsonFetch(dbUrl("/api/db/auth/verify-email"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, verification_code: code }),
  });
}

export async function resendVerificationEmailLegacy(email: string) {
  return jsonFetch(dbUrl("/api/db/auth/resend-verification-email"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

// Profile
export async function getMyProfile() {
  return jsonFetch(dbUrl("/api/db/profile/me"), { headers: buildUnifiedHeaders() });
}

export async function updateMyProfile(body: { display_name: string }) {
  return jsonFetch(dbUrl("/api/db/profile/me"), {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...buildUnifiedHeaders() },
    body: JSON.stringify(body),
  });
}

export async function changePasswordLegacy(current_password: string, new_password: string) {
  return jsonFetch(dbUrl("/api/db/profile/change-password"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...buildUnifiedHeaders() },
    body: JSON.stringify({ current_password, new_password }),
  });
}

// TOTP
export async function totpSetup() {
  return jsonFetch(dbUrl("/api/db/auth/totp/setup"), {
    method: "POST",
    headers: { ...buildUnifiedHeaders() },
  });
}

export async function totpVerifySetup(code: string) {
  return jsonFetch(dbUrl("/api/db/auth/totp/verify-setup"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...buildUnifiedHeaders() },
    body: JSON.stringify({ code }),
  });
}

export async function totpStatus() {
  return jsonFetch(dbUrl("/api/db/auth/totp/status"), { headers: { ...buildUnifiedHeaders() } });
}

export async function totpDisable() {
  return jsonFetch(dbUrl("/api/db/auth/totp/disable"), { method: "POST", headers: { ...buildUnifiedHeaders() } });
}

export async function regenerateBackupCodes() {
  return jsonFetch(dbUrl("/api/db/auth/totp/regenerate-backup-codes"), { method: "POST", headers: { ...buildUnifiedHeaders() } });
}


