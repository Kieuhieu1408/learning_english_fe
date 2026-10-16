export interface NoteOffline {
  id: string; // UUID
  topicId: string | null;
  title: string;
  content: string;
  version: number;
  createdAtMs: number;
  updatedAtMs: number;
}

export type Note = NoteOffline;

export interface ConflictNote {
  title: string;
  content: string;
  updatedAtMs?: number;
}

export interface UpsertNoteParams {
  id?: string;
  topicId?: string | null;
  title: string;
  content: string;
  version?: number;
  createdAtMs?: number;
  createdAt?: string | number;
}

export interface NoteDto {
  id: string;
  topic?: { id: string; name?: string };
  topicId?: string | null;
  title: string;
  content?: string;
  version?: number;
  createdAt?: string | number;
  updatedAt?: string | number;
}
