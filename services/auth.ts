import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ServerAuthResponse,
  TokenResponse,
  UserDto,
} from "~/types";

import { apiFetch, BASE_URL } from "./config";

export type { UserDto, AuthResponse, LoginRequest, RegisterRequest };

function saveTokens(data: TokenResponse): string {
  const accessToken = data.accessToken || data.token || "";
  if (accessToken) {
    localStorage.setItem("jwt_token", accessToken);
  }
  if (data.refreshToken) {
    localStorage.setItem("refresh_token", data.refreshToken);
  }
  return accessToken;
}

// Login/register only return tokens; user info comes from /api/auth/me.
async function finishAuth(
  data: TokenResponse,
  fallbackUsername: string,
): Promise<AuthResponse> {
  const accessToken =
    typeof window !== "undefined" ?
      saveTokens(data)
    : data.accessToken || data.token || "";

  const user = (await getMeApi()) ?? {
    username: data.username || fallbackUsername,
    name: data.name || data.username || fallbackUsername,
    email: data.email,
    role: data.role || "ROLE_USER",
  };
  const role = user.role || data.role || "ROLE_USER";

  if (typeof window !== "undefined") {
    localStorage.setItem("user_role", role);
    localStorage.setItem("username", user.username);
  }
  return { token: accessToken, role, username: user.username, user };
}

export async function loginApi(body: LoginRequest): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Login failed");
  }

  return finishAuth((await res.json()) as TokenResponse, body.username);
}

export async function registerApi(
  body: RegisterRequest,
): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Registration failed");
  }

  return finishAuth((await res.json()) as TokenResponse, body.username);
}

export async function getMeApi(): Promise<UserDto | null> {
  try {
    const res = await apiFetch(`${BASE_URL}/api/auth/me`);
    if (res.ok) {
      const data = (await res.json()) as ServerAuthResponse;
      if (data.username) {
        return {
          username: data.username,
          name: data.name || data.username,
          email: data.email,
          role: data.role || "ROLE_USER",
        };
      }
    }
  } catch {
    // Backend may not have /api/auth/me yet; fallback to localStorage
  }

  if (typeof window !== "undefined") {
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("user_role");
    if (username) {
      return {
        username,
        name: username,
        role: role || "ROLE_USER",
      };
    }
  }
  return null;
}

export async function logoutApi(): Promise<void> {
  if (typeof window !== "undefined") {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      // Revoke server-side; local cleanup must happen even if this fails.
      await fetch(`${BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => undefined);
    }
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("username");
  }
}
