import type { TokenResponse } from "~/types";

export const BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

export function getAuthHeader(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getCommonHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...getAuthHeader(),
  };
}

function decodeJwt(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export interface ApiFetchOptions extends RequestInit {
  skipAuthRedirect?: boolean;
}

let refreshPromise: Promise<boolean> | null = null;

// Exchanges the stored refresh token for a new token pair. Concurrent callers share one request.
function refreshAccessToken(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (refreshPromise) return refreshPromise;

  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return Promise.resolve(false);

  refreshPromise = fetch(`${BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  })
    .then(async (r) => {
      if (!r.ok) return false;
      const data = (await r.json()) as TokenResponse;
      const newAccessToken = data.accessToken || data.token || "";
      if (!newAccessToken) return false;
      localStorage.setItem("jwt_token", newAccessToken);
      if (data.refreshToken) {
        localStorage.setItem("refresh_token", data.refreshToken);
      }
      return true;
    })
    .catch(() => false)
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

export async function apiFetch(
  url: string,
  options: ApiFetchOptions = {},
): Promise<Response> {
  const { skipAuthRedirect, ...fetchOptions } = options;
  const doFetch = () =>
    fetch(url, {
      ...fetchOptions,
      headers: {
        ...getCommonHeaders(),
        ...fetchOptions.headers,
      } as HeadersInit,
    });

  let res = await doFetch();

  // Access token expired: try once to refresh it, then retry the request.
  if (res.status === 401 && (await refreshAccessToken())) {
    res = await doFetch();
  }

  // Only handle 401 Unauthorized for standard auth sessions when skipAuthRedirect is not set.
  // Never redirect on 403 Forbidden (can be permission or business/upstream error).
  // Never kick guest users out to /login.
  if (res.status === 401 && !skipAuthRedirect) {
    if (typeof window !== "undefined") {
      const isGuest = localStorage.getItem("margin_guest_mode") === "true";
      if (!isGuest) {
        console.warn(
          `[apiFetch] Session expired (Status 401 on ${url}). Clearing token and redirecting to login...`,
        );
        localStorage.removeItem("jwt_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user_role");
        localStorage.removeItem("username");
        window.location.replace("/login");
      }
    }
  }

  return res;
}
