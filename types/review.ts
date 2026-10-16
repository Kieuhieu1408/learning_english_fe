import type { WordWithContexts } from "./word";

export type ReviewMode = "FLASHCARD" | "FILL_BLANK";

export type ReviewCard = WordWithContexts;

export interface ReviewSubmission {
  wordId: string;
  isCorrect: boolean;
  quality?: number; // 0 to 5
  mode?: ReviewMode | string;
}

export interface ReviewLogOffline {
  id?: number; // Auto-incremented primary key
  wordId: string;
  isCorrect: boolean;
  quality: number; // 0-5
  mode: ReviewMode;
  reviewedAtMs: number;
}

export type ReviewPhase = "setup" | "active" | "complete" | "empty";
