import Dexie, { type Table } from 'dexie';

export interface TopicOffline {
  id: string; // UUID
  name: string;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface NoteOffline {
  id: string; // UUID
  topicId: string | null;
  title: string;
  content: string;
  version: number;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface WordOffline {
  id: string; // UUID
  noteId: string | null;
  text: string;
  translation: string;
  partOfSpeech: string;
  ipa: string;
  exampleContext: string;
  exampleTranslation: string;
  status: 'NEW' | 'LEARNING' | 'TEMP_REMEMBERED' | 'MASTERED';
  correctStreak: number;
  difficulty: number;
  intervalDays: number;
  nextReviewAt: string; // yyyy-MM-dd
  failedEssayStreak: number;
  version: number;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface SyncQueueItem {
  id?: number; // Auto-incremented primary key
  entityType: 'topic' | 'note' | 'word';
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: string; // JSON string of the entity
  timestamp: number;
}

export interface SyncMetadata {
  key: string; // e.g., 'lastSyncAt', 'dailyWordCount', 'totalWordCount'
  value: string;
}

export class AppOfflineDatabase extends Dexie {
  topics!: Table<TopicOffline, string>;
  notes!: Table<NoteOffline, string>;
  words!: Table<WordOffline, string>;
  syncQueue!: Table<SyncQueueItem, number>;
  syncMetadata!: Table<SyncMetadata, string>;

  constructor() {
    super('EnglishLearningOfflineDB');
    this.version(1).stores({
      topics: 'id, name, updatedAtMs',
      notes: 'id, topicId, title, updatedAtMs',
      words: 'id, noteId, text, nextReviewAt, status, updatedAtMs',
      syncQueue: '++id, entityType, entityId, action, timestamp',
      syncMetadata: 'key',
    });
  }
}

export const db = new AppOfflineDatabase();
