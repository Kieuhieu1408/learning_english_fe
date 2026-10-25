import type { AiConnectionTestResult, AiSettingsDto, ModelInfo } from "~/types";

import { db } from "~/lib/db";

import { apiFetch, BASE_URL } from "./config";

export type { AiSettingsDto, AiConnectionTestResult, ModelInfo };

const LOCAL_AI_KEY = "margin_ai_settings";

/**
 * Fetch AI settings from backend or local storage
 */
export async function fetchAiSettingsApi(): Promise<AiSettingsDto | null> {
  try {
    const res = await apiFetch(`${BASE_URL}/api/ai-settings`, {
      method: "GET",
    });
    if (res.ok && res.status !== 204) {
      const data = (await res.json()) as AiSettingsDto;
      if (data) {
        try {
          await db.configs.put({
            key: LOCAL_AI_KEY,
            value: JSON.stringify(data),
          });
        } catch {
          /* ignore cache error */
        }
        return data;
      }
    }
  } catch {
    // Offline fallback
  }

  try {
    const cached = await db.configs.get(LOCAL_AI_KEY);
    if (cached?.value) {
      return JSON.parse(cached.value) as AiSettingsDto;
    }
  } catch {
    /* ignore cache error */
  }

  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(LOCAL_AI_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as AiSettingsDto;
      } catch {
        /* ignore parse error */
      }
    }
  }

  return {
    provider: "9ROUTER",
    customBaseUrl: "http://localhost:20128/v1",
    baseUrl: "http://localhost:20128/v1",
    modelName: "deepseek-chat",
    translationModel: "deepseek-chat",
    chatModel: "deepseek-chat",
    quizModel: "deepseek-chat",
  };
}

/**
 * Save AI settings to backend (AES-256 encrypted at BE) and local cache
 */
export async function saveAiSettingsApi(
  settings: AiSettingsDto,
): Promise<AiSettingsDto> {
  const customUrl =
    settings.customBaseUrl ||
    settings.baseUrl ||
    (settings.provider === "9ROUTER" ? "http://localhost:20128/v1" : undefined);
  const payload: AiSettingsDto = {
    provider: settings.provider,
    apiKey: settings.apiKey,
    translationModel:
      settings.translationModel || settings.modelName || "deepseek-chat",
    quizModel: settings.quizModel || "deepseek-chat",
    chatModel: settings.chatModel || settings.modelName || "deepseek-chat",
    customBaseUrl: customUrl,
    baseUrl: customUrl,
    modelName: settings.modelName || settings.chatModel || "deepseek-chat",
  };

  try {
    await db.configs.put({ key: LOCAL_AI_KEY, value: JSON.stringify(payload) });
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_AI_KEY, JSON.stringify(payload));
    }
  } catch {
    /* ignore cache error */
  }

  try {
    const res = await apiFetch(`${BASE_URL}/api/ai-settings`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = (await res.json()) as AiSettingsDto;
      return data;
    }
  } catch {
    // Offline: return local payload
  }

  return payload;
}

/**
 * Test AI API connection with provided settings
 */
export async function testAiConnectionApi(
  settings: AiSettingsDto,
): Promise<AiConnectionTestResult> {
  const customUrl =
    settings.customBaseUrl ||
    settings.baseUrl ||
    (settings.provider === "9ROUTER" ? "http://localhost:20128/v1" : undefined);
  const payload: AiSettingsDto = {
    provider: settings.provider,
    apiKey: settings.apiKey,
    customBaseUrl: customUrl,
    baseUrl: customUrl,
    translationModel: settings.translationModel || settings.modelName,
    chatModel: settings.chatModel || settings.modelName,
  };

  try {
    const res = await apiFetch(`${BASE_URL}/api/ai-settings/test`, {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuthRedirect: true,
    });
    if (res.ok) {
      const data = (await res.json()) as {
        connected?: boolean;
        message?: string;
        models?: { id: string; name: string }[];
      };
      return {
        success: !!data.connected,
        message:
          data.message ||
          `Connected successfully to ${settings.provider || "AI Provider"}!`,
        models: data.models?.map((m) => ({
          id: m.id,
          name: m.name && m.name !== "null" ? m.name : m.id,
        })),
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to reach backend AI gateway",
    };
  }

  return {
    success: true,
    message: `Connected successfully to ${settings.provider || "AI Provider"}!`,
  };
}

/**
 * Fetch available models from 9Router (direct gateway call with backend fallback)
 */
export async function fetch9RouterModels(
  baseUrl = "http://localhost:20128/v1",
  apiKey?: string,
): Promise<ModelInfo[]> {
  const cleanBase = (baseUrl || "http://localhost:20128/v1")
    .trim()
    .replace(/\/+$/, "");
  const targetUrl = `${cleanBase}/models`;

  // 1. Direct fetch to 9Router (CORS wildcard enabled)
  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (apiKey?.trim()) {
      headers["Authorization"] = `Bearer ${apiKey.trim()}`;
    }
    const res = await fetch(targetUrl, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const data = (await res.json()) as any;
      const rawList =
        Array.isArray(data?.data) ? data.data
        : Array.isArray(data) ? data
        : [];
      const parsed: ModelInfo[] = rawList
        .map((m: any) => {
          const id = typeof m === "string" ? m : m?.id || "";
          const name =
            typeof m?.name === "string" && m.name.trim() && m.name !== "null" ?
              m.name.trim()
            : id;
          return id ? { id, name } : null;
        })
        .filter(Boolean) as ModelInfo[];
      if (parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn(
      "[ai-settings] Direct 9Router models fetch failed, trying backend:",
      err,
    );
  }

  // 2. Fallback: Backend /api/ai-settings/models
  try {
    const res = await apiFetch(
      `${BASE_URL}/api/ai-settings/models?provider=9ROUTER&baseUrl=${encodeURIComponent(cleanBase)}`,
      { method: "GET" },
    );
    if (res.ok) {
      const data = (await res.json()) as ModelInfo[];
      if (Array.isArray(data) && data.length > 0) {
        return data.map((m) => ({
          id: m.id,
          name: m.name && m.name !== "null" ? m.name : m.id,
        }));
      }
    }
  } catch (err) {
    console.warn("[ai-settings] Backend models endpoint fallback failed:", err);
  }

  // 3. Fallback: Backend test endpoint
  try {
    const testRes = await testAiConnectionApi({
      provider: "9ROUTER",
      customBaseUrl: cleanBase,
      apiKey: apiKey?.trim() || undefined,
    });
    if (testRes.models && testRes.models.length > 0) {
      return testRes.models.map((m) => ({
        id: m.id,
        name: m.name && m.name !== "null" ? m.name : m.id,
      }));
    }
  } catch {
    /* ignore fallback error */
  }

  return [];
}
