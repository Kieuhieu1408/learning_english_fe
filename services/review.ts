import type {
  ReviewCard,
  ReviewMode,
  ReviewSubmission,
  WordContextOffline,
  WordOffline,
  WordWithContexts,
} from "~/types";

import { db } from "~/lib/db";
import { queueLocalChange } from "~/lib/syncManager";

import { apiFetch, BASE_URL } from "./config";

export type { ReviewCard, ReviewSubmission, ReviewMode };

export async function fetchDueCardsApi(limit = 15): Promise<ReviewCard[]> {
  try {
    const res = await apiFetch(`${BASE_URL}/api/review/due?limit=${limit}`);
    if (res.ok) {
      const serverCards = (await res.json()) as WordWithContexts[];
      if (Array.isArray(serverCards) && serverCards.length > 0) {
        return serverCards.map((c) => ({
          ...c,
          meaning: c.meaning || c.translation,
          pos: c.pos || c.partOfSpeech,
        }));
      }
    }
  } catch (err) {
    console.warn("fetchDueCardsApi failed, calculating from local Dexie:", err);
  }

  // Local fallback: find words due on or before today
  const todayStr = new Date().toISOString().split("T")[0] ?? "";
  const allWords = await db.words.toArray();

  const dueWords = allWords
    .filter((w) => !w.nextReviewAt || w.nextReviewAt <= todayStr)
    .sort((a, b) => {
      // Prioritize LEARNING and NEW over REMEMBERED
      const order: Record<string, number> = {
        LEARNING: 0,
        NEW: 1,
        TEMP_REMEMBERED: 2,
        MASTERED: 3,
      };
      return (order[a.status] || 0) - (order[b.status] || 0);
    })
    .slice(0, limit);

  // If there are less than limit due words, pad with other words so the user can practice
  const needed = limit - dueWords.length;
  if (needed > 0) {
    const dueIds = new Set(dueWords.map((w) => w.id));
    const extraWords = allWords
      .filter((w) => !dueIds.has(w.id))
      .slice(0, needed);
    dueWords.push(...extraWords);
  }

  const contexts = await db.wordContexts.toArray();
  const contextMap = new Map<string, WordContextOffline[]>();
  for (const ctx of contexts) {
    const list = contextMap.get(ctx.wordId) || [];
    list.push(ctx);
    contextMap.set(ctx.wordId, list);
  }

  return dueWords.map((w) => ({
    ...w,
    meaning: w.translation,
    pos: w.partOfSpeech,
    contexts:
      contextMap.get(w.id) ||
      (w.exampleContext ?
        [
          {
            id: `ctx-${w.id}`,
            wordId: w.id,
            noteId: w.noteId || null,
            noteTitle: "Saved Context",
            sentence: w.exampleContext,
            translation: w.exampleTranslation || "",
            partOfSpeech: w.partOfSpeech,
            pos: w.partOfSpeech,
            createdAtMs: w.createdAtMs,
            updatedAtMs: w.updatedAtMs,
          },
        ]
      : []),
  }));
}

export async function submitReviewCardApi(
  wordIdOrSub: string | ReviewSubmission,
  isCorrect?: boolean,
  mode: string = "Flashcards",
): Promise<WordOffline | null> {
  const sub: ReviewSubmission =
    typeof wordIdOrSub === "string" ?
      {
        wordId: wordIdOrSub,
        isCorrect: !!isCorrect,
        quality: isCorrect ? 4 : 1,
        mode,
      }
    : wordIdOrSub;

  const word = await db.words.get(sub.wordId);
  if (!word) return null;

  const now = Date.now();
  const today = new Date();

  // SM-2 Spaced Repetition calculation
  let newStreak = word.correctStreak || 0;
  let newInterval = word.intervalDays || 1;
  let newStatus = word.status || "NEW";
  let newDifficulty = word.difficulty || 2.5;

  if (sub.isCorrect) {
    newStreak += 1;
    if (newStreak === 1) {
      newInterval = 1;
    } else if (newStreak === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.max(1, Math.round(newInterval * newDifficulty));
    }

    if (newStreak >= 4 && newInterval >= 14) {
      newStatus = "MASTERED";
    } else if (newStreak >= 2) {
      newStatus = "TEMP_REMEMBERED";
    } else {
      newStatus = "LEARNING";
    }
  } else {
    newStreak = 0;
    newInterval = 1;
    newStatus = "LEARNING";
    newDifficulty = Math.max(1.3, newDifficulty - 0.2);
  }

  const nextDate = new Date(today);
  nextDate.setDate(nextDate.getDate() + newInterval);
  const nextReviewAt = nextDate.toISOString().split("T")[0] ?? "";

  const updatedWord: WordOffline = {
    ...word,
    correctStreak: newStreak,
    intervalDays: newInterval,
    difficulty: newDifficulty,
    status: newStatus,
    nextReviewAt,
    updatedAtMs: now,
  };

  await db.words.put(updatedWord);

  const logMode: ReviewMode =
    sub.mode?.toUpperCase().includes("BLANK") ? "FILL_BLANK" : "FLASHCARD";

  // Record review log for progress analytics
  await db.reviewLogs.put({
    wordId: word.id,
    isCorrect: sub.isCorrect,
    quality: sub.quality || (sub.isCorrect ? 4 : 1),
    mode: logMode,
    reviewedAtMs: now,
  });

  await queueLocalChange("word", word.id, "UPDATE", updatedWord);

  try {
    await apiFetch(`${BASE_URL}/api/review/submit`, {
      method: "POST",
      body: JSON.stringify(sub),
    });
  } catch {
    // Synced via batch
  }

  return updatedWord;
}
