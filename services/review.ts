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

export interface DueCardsResult {
  cards: ReviewCard[];
  totalDue: number;
}

export async function fetchDueCardsWithTotalApi(
  limit = 15,
): Promise<DueCardsResult> {
  try {
    const res = await apiFetch(`${BASE_URL}/api/review/due?limit=${limit}`);
    if (res.ok) {
      const data = (await res.json()) as any;
      const rawWords: any[] = Array.isArray(data) ? data : data?.words || [];
      if (Array.isArray(rawWords) && rawWords.length > 0) {
        const cards: ReviewCard[] = rawWords.map((c: any) => ({
          ...c,
          meaning: c.primaryMeaning || c.meaning || c.translation || "",
          pos: c.partOfSpeech || c.pos || "word",
          contexts: (c.contexts || []).map((ctx: any) => ({
            ...ctx,
            translation: ctx.sentenceTranslation || ctx.translation || "",
            pos: ctx.partOfSpeech || ctx.pos || "word",
          })),
        }));
        const totalDue =
          typeof data?.totalDue === "number" ? data.totalDue : cards.length;
        return { cards, totalDue };
      }
      if (typeof data?.totalDue === "number" && data.totalDue === 0) {
        return { cards: [], totalDue: 0 };
      }
    }
  } catch (err) {
    console.warn("fetchDueCardsApi failed, calculating from local Dexie:", err);
  }

  // Local fallback: find words due on or before today
  const todayStr = new Date().toISOString().split("T")[0] ?? "";
  const allWords = await db.words.toArray();

  const allDueWords = allWords
    .filter((w) => !w.nextReviewAt || w.nextReviewAt <= todayStr)
    .sort((a, b) => {
      const order: Record<string, number> = {
        LEARNING: 0,
        NEW: 1,
        TEMP_REMEMBERED: 2,
        MASTERED: 3,
      };
      return (order[a.status] || 0) - (order[b.status] || 0);
    });

  const totalDue = allDueWords.length;
  const dueWords = allDueWords.slice(0, limit);

  // Pad if needed so user can always practice
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

  const cards = dueWords.map((w) => ({
    ...w,
    meaning: w.translation || w.meaning,
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

  return { cards, totalDue: totalDue || cards.length };
}

export async function fetchDueCardsApi(limit = 15): Promise<ReviewCard[]> {
  const { cards } = await fetchDueCardsWithTotalApi(limit);
  return cards;
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
        quality: isCorrect ? 3 : 1,
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
      newInterval = 3;
    } else if (newStreak === 3) {
      newInterval = 7;
    } else if (newStreak === 4) {
      newInterval = 14;
    } else {
      newInterval = Math.max(1, Math.round(newInterval * newDifficulty));
    }

    if (newStreak >= 5 && newInterval >= 14) {
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

  // Record review log for local analytics
  await db.reviewLogs.put({
    wordId: word.id,
    isCorrect: sub.isCorrect,
    quality: sub.quality || (sub.isCorrect ? 3 : 1),
    mode: logMode,
    reviewedAtMs: now,
  });

  await queueLocalChange("word", word.id, "UPDATE", updatedWord);

  // Call Backend API with exact ReviewSubmitRequest DTO
  try {
    const eventId = crypto.randomUUID();
    const qualityVal = sub.quality || (sub.isCorrect ? 3 : 1);

    await apiFetch(`${BASE_URL}/api/review/submit`, {
      method: "POST",
      body: JSON.stringify({
        events: [
          {
            eventId,
            wordId: word.id,
            quality: qualityVal,
            isCorrect: sub.isCorrect,
            mode: logMode,
            reviewedAt: new Date().toISOString(),
          },
        ],
      }),
    });
  } catch (err) {
    console.warn("submitReviewCardApi online call failed, kept in queue:", err);
  }

  return updatedWord;
}

export async function checkAnswerApi(params: {
  wordId: string;
  sentence?: string;
  typedAnswer: string;
}): Promise<{
  outcome: string;
  isAccepted: boolean;
  quality: number;
  feedback: string;
}> {
  const res = await apiFetch(`${BASE_URL}/api/review/check-answer`, {
    method: "POST",
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error(`Check answer API failed: ${res.status}`);
  }

  return (await res.json()) as {
    outcome: string;
    isAccepted: boolean;
    quality: number;
    feedback: string;
  };
}
