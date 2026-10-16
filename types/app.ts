export type NavView = "Notes" | "Chat" | "Review" | "Vocabulary" | "Progress";

export type EntityManageType = "topic" | "note";

export interface DexieAppConfig {
  key: string; // e.g. 'themeColor'
  value: string;
}

export interface AppConfigDto {
  targetLanguage: string;
  autoTranslateSentence: boolean;
  theme: string;
}

export interface ThemeOption {
  id: string;
  name: string;
  colors: string[];
  bgClass: string;
  darkBgClass: string;
}

export interface UserAppConfig {
  themeColor?: string;
  themeMode?: string;
  availableThemes?: ThemeOption[];
}
