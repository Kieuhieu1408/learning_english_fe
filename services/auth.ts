import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ServerAuthResponse,
  UserDto,
} from "~/types";

import { apiFetch, BASE_URL } from "./config";

export type { UserDto, AuthResponse, LoginRequest, RegisterRequest };

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

  const data = (await res.json()) as ServerAuthResponse;
  const token = data.token || "";
  const role = data.role || "ROLE_USER";
  const username = data.username || body.username;

  const result: AuthResponse = {
    token,
    role,
    username,
    user: {
      username,
      name: data.name || username,
      email: data.email,
      role,
    },
  };

  if (typeof window !== "undefined") {
    localStorage.setItem("jwt_token", token);
    localStorage.setItem("user_role", role);
    localStorage.setItem("username", username);
  }
  return result;
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

  const data = (await res.json()) as ServerAuthResponse;
  const token = data.token || "";
  const role = data.role || "ROLE_USER";
  const username = data.username || body.username;

  const result: AuthResponse = {
    token,
    role,
    username,
    user: {
      username,
      name: data.name || username,
      email: body.email,
      role,
    },
  };

  if (typeof window !== "undefined") {
    localStorage.setItem("jwt_token", token);
    localStorage.setItem("user_role", role);
    localStorage.setItem("username", username);
  }
  return result;
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
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("username");
  }
}
