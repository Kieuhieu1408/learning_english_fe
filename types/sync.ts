import type { NoteOffline } from "./note";
import type { TopicOffline } from "./topic";
import type { WordOffline } from "./word";

export type SyncStatus = "synced" | "offline" | "syncing" | "pending";

export type SyncEntityType = "topic" | "note" | "word" | "wordContext";

export type SyncAction = "CREATE" | "UPDATE" | "DELETE";

export interface SyncQueueItem {
  id?: number; // Auto-incremented primary key
  entityType: SyncEntityType;
  entityId: string;
  action: SyncAction;
  payload: string; // JSON string of the entity
  timestamp: number;
}

export interface SyncMetadata {
  key: string; // e.g., 'lastSyncAt', 'dailyWordCount', 'totalWordCount'
  value: string;
}

export interface BatchSyncRequest {
  topics: unknown[];
  notes: unknown[];
  words: unknown[];
  deletedTopicIds: string[];
  deletedNoteIds: string[];
  deletedWordIds: string[];
}

export interface SyncCounters {
  lastSyncAt?: string;
  dailyWordCount?: number;
  totalWordCount?: number;
}

export interface BatchSyncResponse {
  topics?: TopicOffline[];
  notes?: NoteOffline[];
  words?: WordOffline[];
  serverTimestamp?: number;
  counters?: SyncCounters;
}
