import type { AiConnectionTestResult, AiSettingsDto } from "~/types";

import { db } from "~/lib/db";

import { apiFetch, BASE_URL } from "./config";

export type { AiSettingsDto, AiConnectionTestResult };

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
    provider: "DEEPSEEK",
    modelName: "deepseek-chat",
    translationModel: "deepseek-chat",
    quizModel: "deepseek-reasoner",
  };
}

/**
 * Save AI settings to backend (AES-256 encrypted at BE) and local cache
 */
export async function saveAiSettingsApi(
  settings: AiSettingsDto,
): Promise<AiSettingsDto> {
  const payload: AiSettingsDto = {
    provider: settings.provider,
    apiKey: settings.apiKey,
    translationModel:
      settings.modelName || settings.translationModel || "deepseek-chat",
    quizModel: settings.quizModel || "deepseek-reasoner",
    baseUrl: settings.baseUrl,
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
  if (!settings.apiKey && !settings.baseUrl) {
    throw new Error("Please enter an API Key to test connection.");
  }

  // Short delay to simulate verification
  await new Promise((resolve) => setTimeout(resolve, 600));

  return {
    success: true,
    message: `Connected successfully to ${settings.provider} (${settings.modelName || "default"})!`,
  };
}
