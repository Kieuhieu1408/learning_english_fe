import Dexie from "dexie";

import type { Table } from "dexie";

import type {
  DexieAppConfig,
  NoteOffline,
  ReviewLogOffline,
  SyncMetadata,
  SyncQueueItem,
  TopicOffline,
  WordContextOffline,
  WordOffline,
  WordWithContexts,
} from "~/types";

export type {
  TopicOffline,
  NoteOffline,
  WordContextOffline,
  WordOffline,
  WordWithContexts,
  ReviewLogOffline,
  SyncQueueItem,
  SyncMetadata,
};

export type AppConfig = DexieAppConfig;

export class AppOfflineDatabase extends Dexie {
  topics!: Table<TopicOffline, string>;
  notes!: Table<NoteOffline, string>;
  words!: Table<WordOffline, string>;
  wordContexts!: Table<WordContextOffline, string>;
  reviewLogs!: Table<ReviewLogOffline, number>;
  syncQueue!: Table<SyncQueueItem, number>;
  syncMetadata!: Table<SyncMetadata, string>;
  configs!: Table<DexieAppConfig, string>;

  constructor() {
    super("EnglishLearningOfflineDB");

    this.version(1).stores({
      topics: "id, name, updatedAtMs",
      notes: "id, topicId, title, updatedAtMs",
      words: "id, noteId, text, nextReviewAt, status, updatedAtMs",
      syncQueue: "++id, entityType, entityId, action, timestamp",
      syncMetadata: "key",
    });

    this.version(2).stores({
      topics: "id, name, updatedAtMs",
      notes: "id, topicId, title, updatedAtMs",
      words: "id, noteId, text, nextReviewAt, status, updatedAtMs",
      syncQueue: "++id, entityType, entityId, action, timestamp",
      syncMetadata: "key",
      configs: "key",
    });

    this.version(3)
      .stores({
        topics: "id, name, updatedAtMs",
        notes: "id, topicId, title, updatedAtMs",
        words: "id, noteId, text, nextReviewAt, status, updatedAtMs",
        wordContexts: "id, wordId, noteId, updatedAtMs",
        reviewLogs: "++id, wordId, isCorrect, reviewedAtMs",
        syncQueue: "++id, entityType, entityId, action, timestamp",
        syncMetadata: "key",
        configs: "key",
      })
      .upgrade(async (trans) => {
        // Migrate existing exampleContexts in words into wordContexts table
        const wordsTable = trans.table<WordOffline, string>("words");
        const contextsTable = trans.table<WordContextOffline, string>(
          "wordContexts",
        );
        const existingWords = await wordsTable.toArray();
        for (const w of existingWords) {
          if (w.exampleContext) {
            await contextsTable.put({
              id: crypto.randomUUID(),
              wordId: w.id,
              noteId: w.noteId || null,
              noteTitle: "Source Note",
              sentence: w.exampleContext,
              translation: w.exampleTranslation || "",
              partOfSpeech: w.partOfSpeech || "word",
              createdAtMs: w.createdAtMs || Date.now(),
              updatedAtMs: w.updatedAtMs || Date.now(),
            });
          }
        }
      });
  }
}

export const db = new AppOfflineDatabase();
