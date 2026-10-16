export interface ActivityCalendarDay {
  dayIndex: number;
  date: string; // YYYY-MM-DD
  filled: boolean;
  count: number;
  isCurrent: boolean;
}

export interface WordDistribution {
  new: number;
  learning: number;
  remembered: number;
  mastered: number;
}

export interface ProgressDashboardData {
  accuracyPercent: number | null; // e.g. 88
  reviewedToday: number; // e.g. 15
  dailyTarget: number; // e.g. 20
  totalWords: number;
  newAddedCount: number;
  streakDays: number;
  distribution: WordDistribution;
  activityCalendar: ActivityCalendarDay[];
}

export interface ServerProgressDashboardDto {
  accuracyPercent?: number | null;
  reviewedToday?: number;
  dailyTarget?: number;
  totalWords?: number;
  wordsCollected?: number;
  newAddedCount?: number;
  streakDays?: number;
  currentStreakDays?: number;
  distribution?: {
    new?: number;
    newCount?: number;
    learning?: number;
    learningCount?: number;
    remembered?: number;
    rememberedCount?: number;
    mastered?: number;
    masteredCount?: number;
  };
  activityCalendar?: ActivityCalendarDay[];
}
