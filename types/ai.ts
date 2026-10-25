export type AiProvider =
  | "9ROUTER"
  | "DEEPSEEK"
  | "GEMINI"
  | "OPENAI"
  | "ANTHROPIC"
  | "9router"
  | "deepseek"
  | "google"
  | "openai"
  | "anthropic";

export interface AiSettingsDto {
  provider: string;
  apiKey?: string;
  hasApiKey?: boolean;
  apiKeyHint?: string;
  modelName?: string;
  customBaseUrl?: string;
  baseUrl?: string;
  translationModel?: string;
  quizModel?: string;
  chatModel?: string;
}

export interface AiSettings {
  provider: "9router" | "deepseek" | "google" | "openai" | "anthropic";
  apiKey: string;
  translationModel: string;
  quizModel: string;
  chatModel?: string;
  customBaseUrl?: string;
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
  models?: ModelInfo[];
}
