export type AiProvider = "DEEPSEEK" | "GOOGLE" | "deepseek" | "google";

export interface AiSettingsDto {
  provider: string;
  apiKey?: string;
  modelName?: string;
  translationModel?: string;
  quizModel?: string;
  baseUrl?: string;
}

export interface AiSettings {
  provider: "deepseek" | "google";
  apiKey: string;
  translationModel: string;
  quizModel: string;
}

export interface ModelInfo {
  id: string;
  name: string;
}

export interface AITranslateResult {
  text: string;
  translation: string;
  partOfSpeech: string;
  ipa: string;
  exampleContext: string;
  exampleTranslation: string;
}

export interface GradeResult {
  correct: boolean;
  score: number;
  feedback: string;
}

export interface AiConnectionTestResult {
  success: boolean;
  message: string;
}
