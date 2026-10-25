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
  try {
    const res = await apiFetch(`${BASE_URL}/api/words?limit=200`);
    if (res.ok) {
      const data = (await res.json()) as any;
      const serverWords: any[] = Array.isArray(data) ? data : data?.words || [];
      if (Array.isArray(serverWords) && serverWords.length > 0) {
        for (const item of serverWords) {
          const w = item as any;
          const now = Date.now();
          const wordOffline: WordOffline = {
            id: w.id,
            text: w.text,
            translation: w.primaryMeaning || w.translation || "",
            meaning: w.primaryMeaning || w.meaning || "",
            partOfSpeech: w.partOfSpeech || "word",
            pos: w.partOfSpeech || "word",
            ipa: w.ipa || "",
            status: w.status || "NEW",
            correctStreak: w.correctStreak || 0,
            difficulty: w.easeFactor || 2.5,
            intervalDays: w.intervalDays || 1,
            nextReviewAt:
              w.nextReviewAt ?
                w.nextReviewAt.includes("T") ?
                  w.nextReviewAt.split("T")[0]
                : w.nextReviewAt
              : "",
            failedEssayStreak: 0,
            version: 1,
            createdAtMs: w.createdAt ? new Date(w.createdAt).getTime() : now,
            updatedAtMs: w.updatedAt ? new Date(w.updatedAt).getTime() : now,
          };
          await db.words.put(wordOffline);

          if (Array.isArray(w.contexts)) {
            for (const c of w.contexts) {
              const ctx = c as any;
              const ctxOffline: WordContextOffline = {
                id: ctx.id,
                wordId: w.id,
                noteId: ctx.noteId || null,
                noteTitle:
                  ctx.noteTitleSnapshot || ctx.noteTitle || "Saved Note",
                sentence: ctx.sentence || "",
                translation: ctx.sentenceTranslation || ctx.translation || "",
                partOfSpeech: ctx.partOfSpeech || "word",
                pos: ctx.partOfSpeech || "word",
                createdAtMs:
                  ctx.createdAt ? new Date(ctx.createdAt).getTime() : now,
                updatedAtMs: now,
              };
              await db.wordContexts.put(ctxOffline);
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn(
      "fetchWordsWithContexts online fetch failed, using local Dexie:",
      err,
    );
  }

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
      meaning: w.translation || w.meaning,
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
      meaning: existingWord.translation || existingWord.meaning,
      pos: existingWord.partOfSpeech,
    };
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

  // Sync to Backend directly
  try {
    const res = await apiFetch(`${BASE_URL}/api/words/context`, {
      method: "POST",
      body: JSON.stringify({
        wordId: targetWord.id,
        contextId: newContext.id,
        text: targetWord.text,
        meaning: meaningVal,
        sentence: newContext.sentence,
        sentenceTranslation: newContext.translation,
        partOfSpeech: posVal,
        ipa: targetWord.ipa,
        noteId: newContext.noteId,
        noteTitleSnapshot: newContext.noteTitle,
      }),
    });

    if (res.ok) {
      const serverRes = (await res.json()) as any;
      if (serverRes?.word && serverRes?.context) {
        // Handle deduplication id remapping from server
        if (serverRes.word.id && serverRes.word.id !== targetWord.id) {
          await db.words.delete(targetWord.id);
          targetWord.id = serverRes.word.id;
          newContext.wordId = serverRes.word.id;
        }
        await db.words.put(targetWord);
        await db.wordContexts.put(newContext);
      }
    }
  } catch (err) {
    console.warn("captureWordContext online call failed, saved locally:", err);
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

  try {
    await apiFetch(`${BASE_URL}/api/words/${id}`, {
      method: "DELETE",
    });
  } catch (err) {
    console.warn("deleteWordApi online call failed, queued locally:", err);
  }
}
