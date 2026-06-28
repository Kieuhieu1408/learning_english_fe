import { BASE_URL } from "./config";

export interface AuthResponse {
  token: string;
  role: string;
  username: string;
}

export async function loginApi(body: any): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as any;
    throw new Error(errorData.message || "Authentication failed");
  }

  return res.json() as Promise<AuthResponse>;
}

export async function registerApi(body: any): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as any;
    throw new Error(errorData.message || "Registration failed");
  }

  return res.json() as Promise<AuthResponse>;
}
