import { HumanMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";

import type { AiSettings } from "../services/user";

import { fetchAiSettings } from "../services/user";

let _cachedSettings: AiSettings | null = null;

async function getSettings(): Promise<AiSettings> {
  if (_cachedSettings) return _cachedSettings;

  const settings = await fetchAiSettings();
  if (!settings) {
    throw new Error(
      "AI settings not configured. Please go to Settings and configure your API key.",
    );
  }

  _cachedSettings = settings;
  return settings;
}

function createChatModel(provider: string, apiKey: string, modelName: string) {
  if (provider === "deepseek") {
    return new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: modelName,
      configuration: { baseURL: "https://api.deepseek.com" },
    });
  } else {
    return new ChatGoogleGenerativeAI({
      apiKey: apiKey,
      model: modelName,
    });
  }
}

export interface AITranslateResult {
  text: string;
  translation: string;
  partOfSpeech: string;
  ipa: string;
  exampleContext: string;
  exampleTranslation: string;
}

export async function translateWord(text: string): Promise<AITranslateResult> {
  const settings = await getSettings();
  const model = createChatModel(
    settings.provider,
    settings.apiKey,
    settings.translationModel,
  );

  const prompt = `You are an English-to-Vietnamese dictionary assistant. Translate the following English word/phrase and return ONLY a valid JSON object with these exact fields:
{
  "text": "${text}",
  "translation": "Vietnamese translation",
  "partOfSpeech": "Noun/Verb/Adjective/Adverb/etc.",
  "ipa": "IPA pronunciation",
  "exampleContext": "An example English sentence using this word",
  "exampleTranslation": "Vietnamese translation of the example sentence"
}

Word to translate: "${text}"

Return ONLY the JSON object, no markdown, no code blocks, no explanation.`;

  const response = await model.invoke([new HumanMessage(prompt)]);
  const content =
    typeof response.content === "string" ?
      response.content
    : JSON.stringify(response.content);

  // Parse JSON from response, handling possible markdown code blocks
  let cleanJson = content.trim();
  if (cleanJson.startsWith("```")) {
    cleanJson = cleanJson
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "");
  }

  try {
    const parsed = JSON.parse(cleanJson) as AITranslateResult;
    return {
      text: parsed.text || text,
      translation: parsed.translation || "",
      partOfSpeech: parsed.partOfSpeech || "Noun",
      ipa: parsed.ipa || "",
      exampleContext: parsed.exampleContext || "",
      exampleTranslation: parsed.exampleTranslation || "",
    };
  } catch {
    // If JSON parsing fails, return a basic result
    return {
      text,
      translation: content.substring(0, 100),
      partOfSpeech: "Noun",
      ipa: "",
      exampleContext: "",
      exampleTranslation: "",
    };
  }
}

export interface GradeResult {
  correct: boolean;
  score: number;
  feedback: string;
}

export async function gradeQuizAnswer(
  word: string,
  answer: string,
): Promise<GradeResult> {
  const settings = await getSettings();
  const model = createChatModel(
    settings.provider,
    settings.apiKey,
    settings.quizModel,
  );

  const prompt = `You are grading a vocabulary quiz. The correct English word is "${word}". The student's answer is "${answer}".

Evaluate whether the student's answer is correct (exact match or acceptable spelling variation).

Return ONLY a valid JSON object:
{
  "correct": true/false,
  "score": 0-5 (0=completely wrong, 5=perfect match),
  "feedback": "Brief feedback message"
}

Return ONLY the JSON object, no markdown, no code blocks.`;

  const response = await model.invoke([new HumanMessage(prompt)]);
  const content =
    typeof response.content === "string" ?
      response.content
    : JSON.stringify(response.content);

  let cleanJson = content.trim();
  if (cleanJson.startsWith("```")) {
    cleanJson = cleanJson
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "");
  }

  try {
    const parsed = JSON.parse(cleanJson) as GradeResult;
    return {
      correct: !!parsed.correct,
      score: parsed.score ?? (parsed.correct ? 5 : 1),
      feedback: parsed.feedback || "",
    };
  } catch {
    // Fallback: simple string comparison
    const isCorrect = word.trim().toLowerCase() === answer.trim().toLowerCase();
    return {
      correct: isCorrect,
      score: isCorrect ? 5 : 1,
      feedback: isCorrect ? "Correct!" : `The correct answer was "${word}"`,
    };
  }
}

export function clearAiCache() {
  _cachedSettings = null;
}
