export type WordStatus = "NEW" | "LEARNING" | "TEMP_REMEMBERED" | "MASTERED";

export interface WordContextOffline {
  id: string; // UUID
  wordId: string; // FK to WordOffline.id
  noteId: string | null;
  noteTitle: string; // Snapshot of note title
  sentence: string; // Context sentence
  translation: string; // Vietnamese translation of sentence
  partOfSpeech?: string;
  pos?: string; // Compatibility alias
  createdAtMs: number;
  updatedAtMs: number;
}

export interface WordOffline {
  id: string; // UUID
  noteId?: string | null;
  text: string;
  translation: string; // Meaning in Vietnamese (Canonical)
  meaning?: string; // UI compatibility alias
  partOfSpeech: string; // Canonical part of speech
  pos?: string; // UI compatibility alias
  ipa: string;
  exampleContext?: string;
  exampleTranslation?: string;
  status: WordStatus;
  correctStreak: number;
  difficulty: number;
  intervalDays: number;
  nextReviewAt: string; // yyyy-MM-dd
  failedEssayStreak: number;
  version: number;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface WordWithContexts extends WordOffline {
  contexts: WordContextOffline[];
}

export type Word = WordWithContexts;

export type PopoverStage = "preview" | "loading" | "error" | "translated";

export interface PopoverSelection {
  text: string;
  sentence: string;
  x: number;
  y: number;
  stage: PopoverStage;
  meaning: string;
  translation: string;
  ipa?: string;
  pos?: string;
}

export interface ExistingWordSummary {
  id: string;
  text: string;
  meaning: string;
  contextsCount: number;
}

export interface CaptureWordContextParams {
  text: string;
  sentence: string;
  translation: string;
  meaning?: string;
  ipa?: string;
  partOfSpeech?: string;
  pos?: string;
  noteId?: string | null;
  noteTitle?: string;
}

export interface CaptureWordContextResult {
  word: WordOffline;
  isNewWord: boolean;
  context: WordContextOffline;
}
