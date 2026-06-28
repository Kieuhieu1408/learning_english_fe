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

export async function apiFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers = {
    ...getCommonHeaders(),
    ...options.headers,
  } as HeadersInit;

  const token =
    typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null;
  if (token) {
    console.log(`[apiFetch] Decoded Token for ${url}:`, decodeJwt(token));
  }

  console.log(`[apiFetch] Requesting: ${url}`, {
    method: options.method || "GET",
    headers: { ...headers },
  });

  const res = await fetch(url, {
    ...options,
    headers,
  });

  console.log(`[apiFetch] Response from: ${url} -> Status: ${res.status}`);

  if (res.status === 401 || res.status === 403) {
    console.warn(
      `[apiFetch] Session expired or invalid (Status ${res.status}). Clearing token and redirecting in 5 seconds...`,
    );
    if (typeof window !== "undefined") {
      localStorage.removeItem("jwt_token");
      localStorage.removeItem("user_role");
      localStorage.removeItem("username");
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    }
  }

  return res;
}
