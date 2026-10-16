import type {
  CaptureWordContextParams,
  CaptureWordContextResult,
  WordContextOffline,
  WordOffline,
  WordWithContexts,
} from "~/types";

import { db } from "~/lib/db";
import { normalize } from "~/lib/demoData";
import { queueLocalChange } from "~/lib/syncManager";

import { apiFetch, BASE_URL } from "./config";

export type {
  WordWithContexts,
  CaptureWordContextParams,
  CaptureWordContextResult,
};

export async function fetchWordsWithContexts(): Promise<WordWithContexts[]> {
  const words = await db.words.toArray();
  const contexts = await db.wordContexts.toArray();

  const contextMap = new Map<string, WordContextOffline[]>();
  for (const ctx of contexts) {
    const list = contextMap.get(ctx.wordId) || [];
    list.push({
      ...ctx,
      pos: ctx.partOfSpeech || ctx.pos,
    });
    contextMap.set(ctx.wordId, list);
  }

  return words.map((w) => {
    const wordContexts =
      contextMap.get(w.id) ||
      (w.exampleContext ?
        [
          {
            id: `ctx-${w.id}`,
            wordId: w.id,
            noteId: w.noteId || null,
            noteTitle: "Source Note",
            sentence: w.exampleContext,
            translation: w.exampleTranslation || "",
            partOfSpeech: w.partOfSpeech,
            pos: w.partOfSpeech,
            createdAtMs: w.createdAtMs,
            updatedAtMs: w.updatedAtMs,
          },
        ]
      : []);

    return {
      ...w,
      meaning: w.translation,
      pos: w.partOfSpeech,
      contexts: wordContexts,
    };
  });
}

export async function captureWordContext(params: {
  text?: string;
  word?: string;
  ipa?: string;
  pos?: string;
  partOfSpeech?: string;
  meaning?: string;
  sentence: string;
  translation: string;
  noteId?: string | null;
  noteTitle?: string;
}): Promise<CaptureWordContextResult> {
  const rawWord = params.text || params.word || "";
  const normText = normalize(rawWord);
  const existingWords = await db.words.toArray();
  const existingWord = existingWords.find(
    (w) => normalize(w.text) === normText,
  );

  const now = Date.now();
  const todayStr = new Date().toISOString().split("T")[0] ?? "";
  const meaningVal = (params.meaning || params.translation || "").trim();
  const posVal = params.pos || params.partOfSpeech || "word";

  let targetWord: WordOffline;
  let isNewWord = false;

  if (existingWord) {
    targetWord = {
      ...existingWord,
      meaning: existingWord.translation,
      pos: existingWord.partOfSpeech,
    };
    // Check if this exact sentence context is already saved
    const existingCtx = await db.wordContexts
      .where("wordId")
      .equals(existingWord.id)
      .toArray();

    const normSentence = params.sentence.trim().toLowerCase();
    const matchedCtx = existingCtx.find(
      (c) => c.sentence.trim().toLowerCase() === normSentence,
    );

    if (matchedCtx) {
      return {
        word: targetWord,
        isNewWord: false,
        context: matchedCtx,
      };
    }
  } else {
    isNewWord = true;
    targetWord = {
      id: crypto.randomUUID(),
      noteId: params.noteId || null,
      text: rawWord.trim().toLowerCase(),
      ipa: params.ipa || "",
      partOfSpeech: posVal,
      pos: posVal,
      translation: meaningVal,
      meaning: meaningVal,
      exampleContext: params.sentence,
      exampleTranslation: params.translation,
      status: "NEW",
      correctStreak: 0,
      difficulty: 2.5,
      intervalDays: 1,
      nextReviewAt: todayStr,
      failedEssayStreak: 0,
      version: 1,
      createdAtMs: now,
      updatedAtMs: now,
    };
    await db.words.put(targetWord);
    await queueLocalChange("word", targetWord.id, "CREATE", targetWord);
  }

  const newContext: WordContextOffline = {
    id: crypto.randomUUID(),
    wordId: targetWord.id,
    noteId: params.noteId || null,
    noteTitle: params.noteTitle || "Saved Note",
    sentence: params.sentence.trim(),
    translation: params.translation.trim(),
    partOfSpeech: posVal,
    pos: posVal,
    createdAtMs: now,
    updatedAtMs: now,
  };

  await db.wordContexts.put(newContext);

  // Sync to Backend if endpoint is available
  try {
    await apiFetch(`${BASE_URL}/api/words/context`, {
      method: "POST",
      body: JSON.stringify({
        wordId: targetWord.id,
        text: targetWord.text,
        meaning: targetWord.translation,
        sentence: newContext.sentence,
        translation: newContext.translation,
        noteId: newContext.noteId,
      }),
    });
  } catch {
    // Queued in batch sync
  }

  return { word: targetWord, isNewWord, context: newContext };
}

export async function deleteWordApi(id: string): Promise<void> {
  await db.words.delete(id);
  const contexts = await db.wordContexts.where("wordId").equals(id).toArray();
  for (const ctx of contexts) {
    await db.wordContexts.delete(ctx.id);
  }
  await queueLocalChange("word", id, "DELETE", { id });
}
