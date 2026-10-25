import { apiFetch, BASE_URL } from "./config";

export interface TranslateContextRequest {
  text: string;
  sentence?: string;
  noteId?: string;
  noteTitle?: string;
}

export interface TranslateContextResponse {
  text: string;
  ipa?: string;
  partOfSpeech?: string;
  meaning: string;
  sentence?: string;
  sentenceTranslation?: string;
}

export function formatAiErrorMessage(raw: string): string {
  const cleaned = (raw || "")
    .replace(/<EOL>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const lower = cleaned.toLowerCase();

  if (
    lower.includes("api_key_invalid") ||
    lower.includes("api key not valid") ||
    lower.includes("api key is not configured") ||
    lower.includes("invalid_api_key") ||
    lower.includes("unauthorized") ||
    lower.includes("401")
  ) {
    return "AI API key is missing or invalid. Open AI Settings (bottom-left profile menu) to configure a valid key.";
  }

  if (
    lower.includes("connectexception") ||
    lower.includes("connection refused") ||
    lower.includes("localhost:20128")
  ) {
    return "Could not connect to the AI gateway. Open AI Settings to configure your provider and API key.";
  }

  if (
    lower.includes("quota") ||
    lower.includes("429") ||
    lower.includes("rate limit")
  ) {
    return "AI rate limit or quota exceeded. Please try again in a moment or switch models in AI Settings.";
  }

  if (!cleaned || cleaned.includes("{")) {
    return "AI translation is currently unavailable. Please check your AI Settings or enter the meaning manually below.";
  }

  return cleaned.length > 160 ? `${cleaned.slice(0, 157)}…` : cleaned;
}

/**
 * Call Backend AI Gateway to translate a word in its sentence context
 */
export async function translateContextApi(
  params: TranslateContextRequest,
): Promise<TranslateContextResponse> {
  const res = await apiFetch(`${BASE_URL}/api/ai/translate-context`, {
    method: "POST",
    body: JSON.stringify(params),
    skipAuthRedirect: true,
  });

  if (!res.ok) {
    let errorMessage = "";
    try {
      const errorJson = (await res.json()) as any;
      errorMessage =
        errorJson?.message || errorJson?.error || JSON.stringify(errorJson);
    } catch {
      errorMessage = await res.text().catch(() => "");
    }
    throw new Error(formatAiErrorMessage(errorMessage || res.statusText));
  }

  return (await res.json()) as TranslateContextResponse;
}

/**
 * Call Backend AI Gateway for batch word translation
 */
export async function translateWordsApi(words: string[]): Promise<any[]> {
  const res = await apiFetch(`${BASE_URL}/api/ai/translate`, {
    method: "POST",
    body: JSON.stringify(words),
    skipAuthRedirect: true,
  });

  if (!res.ok) {
    throw new Error(`Translate words failed (${res.status})`);
  }

  return (await res.json()) as any[];
}
