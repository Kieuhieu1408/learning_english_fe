import type {
  ChatMessage,
  ChatResponse,
  ChatSendParams,
  Conversation,
} from "~/types";

import { dictionary } from "~/lib/demoData";

import { apiFetch, BASE_URL } from "./config";

export type { ChatMessage, Conversation, ChatSendParams, ChatResponse };

export const initialConversations: Conversation[] = [
  {
    id: "attention",
    title: "Understanding “linger”",
    messages: [
      { role: "user", text: "What does linger mean?" },
      {
        role: "assistant",
        text: "Linger /ˈlɪŋ.ɡər/ · verb\n\nNán lại, lưu lại — to stay somewhere longer than expected because you don’t want to leave.\n\nExample: “We lingered over coffee on a quiet Sunday.”\nChúng tôi nán lại bên tách cà phê vào một ngày Chủ nhật yên tĩnh.\n\nTry writing one sentence about a place you’d like to linger.",
      },
    ],
  },
  {
    id: "practice",
    title: "A small vocabulary practice",
    messages: [
      { role: "user", text: "Give me a vocabulary exercise." },
      {
        role: "assistant",
        text: "Let’s practice a word in context.\n\n“She likes to ______ her curiosity by reading something new every day.”\n\nHint: nuôi dưỡng, trau dồi. The word starts with c.\n\nSample answer: cultivate.",
      },
    ],
  },
];

export function sampleReply(text: string): string {
  const normalized = text.toLowerCase();

  if (normalized.includes("practice") || normalized.includes("exercise")) {
    return "A little practice, one word at a time.\n\nFill in the blank:\n“We decided to ______ over coffee instead of rushing home.”\n\nHint: nán lại. Think of a word that means staying a little longer.\n\nSample answer: linger.\n\nThis is a prepared learning exercise to enrich your vocabulary.";
  }

  const entry = dictionary.find(([word]) =>
    new RegExp(`\\b${word}\\b`, "i").test(text),
  );

  if (entry) {
    return `${entry[0]} ${entry[1]} · ${entry[2]}\n\nVietnamese meaning: ${entry[3]}.\n\nTry finding this word in one of your notes, then write your own sentence with it. Reading it in context helps it stay with you.`;
  }

  if (normalized.includes("attention") || normalized.includes("summar")) {
    return "The art of paying attention — a reading companion\n\nThe note invites us to slow down and notice ordinary moments. Attention is something we can practice through small, deliberate choices, not a personality trait.\n\nWords to explore: linger, cultivate, deliberate, receptive.\n\nReflection: What is one small thing you noticed today?";
  }

  return "I'm your margin companion, here to help you explore English in context.\n\nYou can ask about words from your lexicon (try “linger”, “cultivate”, “deliberate”), request a quick fill-in-the-blank practice, or ask for a reflection on what you are currently reading.";
}

export async function sendChatMessageApi(
  paramsOrId: string | ChatSendParams,
  maybeText?: string,
  maybeHistory: ChatMessage[] = [],
): Promise<ChatResponse> {
  const message =
    typeof paramsOrId === "string" ? maybeText || "" : paramsOrId.message;
  const conversationId =
    typeof paramsOrId === "string" ? paramsOrId : (
      paramsOrId.conversationId || "general"
    );
  const conversationHistory =
    typeof paramsOrId === "string" ? maybeHistory : (
      paramsOrId.conversationHistory || []
    );

  // 1. Try Backend Chat API
  try {
    const res = await apiFetch(`${BASE_URL}/api/chat/send`, {
      method: "POST",
      body: JSON.stringify({
        conversationId,
        message,
        history: conversationHistory,
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as ChatResponse;
      if (data?.reply) return { reply: data.reply };
    }
  } catch {
    // Backend API not yet available, fallback to local intelligent sample reply
  }

  // 2. Fallback to sample reply with natural reading pause
  await new Promise((resolve) => setTimeout(resolve, 650));
  return { reply: sampleReply(message) };
}
