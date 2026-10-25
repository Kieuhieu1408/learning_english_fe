import type { AiSettings, AITranslateResult, GradeResult } from "~/types";

import { translateContextApi } from "../services/ai";
import { fetchAiSettings } from "../services/user";

export type { AITranslateResult, GradeResult };

let _cachedSettings: AiSettings | null = null;

export async function getSettings(): Promise<AiSettings> {
  if (_cachedSettings) return _cachedSettings;

  const settings = await fetchAiSettings();
  if (!settings) {
    throw new Error(
      "AI settings not configured. Please go to Settings and configure your API key.",
    );
  }

  _cachedSettings = settings;
  return settings;
}

/**
 * Translates an English word/phrase, using the backend AI gateway with the user's real configured API key.
 */
export async function translateWord(
  text: string,
  sentence?: string,
): Promise<AITranslateResult> {
  const result = await translateContextApi({
    text: text.trim(),
    sentence: sentence?.trim() || undefined,
  });

  return {
    text: result.text || text,
    translation: result.meaning || "",
    partOfSpeech: result.partOfSpeech || "Noun",
    ipa: result.ipa || "",
    exampleContext: result.sentence || sentence || "",
    exampleTranslation: result.sentenceTranslation || "",
  };
}

/**
 * Evaluates a quiz answer against the correct word.
 */
export async function gradeQuizAnswer(
  word: string,
  answer: string,
): Promise<GradeResult> {
  const isCorrect = word.trim().toLowerCase() === answer.trim().toLowerCase();
  return {
    correct: isCorrect,
    score: isCorrect ? 5 : 1,
    feedback: isCorrect ? "Exact match!" : `The correct answer was "${word}"`,
  };
}

export function clearAiCache() {
  _cachedSettings = null;
}
