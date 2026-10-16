export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  text: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
}

export type ChatThread = Conversation;

export interface ChatSendParams {
  message: string;
  conversationId?: string;
  conversationHistory?: ChatMessage[];
}

export interface ChatResponse {
  reply: string;
}
