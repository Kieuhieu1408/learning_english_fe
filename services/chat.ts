import type {
  ChatMessage,
  ChatResponse,
  ChatSendParams,
  Conversation,
} from "~/types";

import { apiFetch, BASE_URL } from "./config";

export type { ChatMessage, Conversation, ChatSendParams, ChatResponse };

export async function fetchConversationsApi(): Promise<Conversation[]> {
  try {
    const res = await apiFetch(`${BASE_URL}/api/chat/conversations`);
    if (res.ok) {
      const data = (await res.json()) as any;
      if (Array.isArray(data)) {
        return data.map((c: any) => ({
          id: c.id,
          title: c.title,
          messages: [],
        }));
      }
    }
  } catch (err) {
    console.warn("fetchConversationsApi failed:", err);
  }
  return [];
}

export async function fetchMessagesApi(
  conversationId: string,
): Promise<ChatMessage[]> {
  try {
    const res = await apiFetch(
      `${BASE_URL}/api/chat/conversations/${conversationId}/messages`,
    );
    if (res.ok) {
      const data = (await res.json()) as any;
      if (Array.isArray(data)) {
        return data.map((m: any) => ({
          role: m.role?.toLowerCase() === "user" ? "user" : "assistant",
          text: m.content || "",
        }));
      }
    }
  } catch (err) {
    console.warn("fetchMessagesApi failed:", err);
  }
  return [];
}

export async function createConversationApi(
  title: string,
  noteId?: string,
): Promise<{ id: string; title: string }> {
  const res = await apiFetch(`${BASE_URL}/api/chat/conversations`, {
    method: "POST",
    body: JSON.stringify({
      id: crypto.randomUUID(),
      title,
      noteId: noteId || null,
    }),
  });
  if (!res.ok) {
    throw new Error("Failed to create conversation");
  }
  return (await res.json()) as { id: string; title: string };
}

export async function sendChatMessageApi(
  paramsOrId: string | ChatSendParams,
  maybeText?: string,
  _maybeHistory: ChatMessage[] = [],
  onChunk?: (token: string) => void,
): Promise<ChatResponse> {
  const message =
    typeof paramsOrId === "string" ? maybeText || "" : paramsOrId.message;
  const conversationId =
    typeof paramsOrId === "string" ? paramsOrId : paramsOrId.conversationId;

  // Call Backend Real Chat SSE endpoint
  // apiFetch transparently refreshes an expired access token and retries once.
  const res = await apiFetch(`${BASE_URL}/api/chat/send`, {
    method: "POST",
    skipAuthRedirect: true,
    body: JSON.stringify({
      conversationId:
        conversationId && conversationId.length === 36 ? conversationId : null,
      message,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Chat request failed: ${res.status} ${errText}`);
  }

  // Parse SSE Stream
  const reader = res.body?.getReader();
  if (!reader) {
    return { reply: "Done" };
  }

  const decoder = new TextDecoder();
  let fullReply = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data:")) {
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") continue;

        try {
          const parsed: any = JSON.parse(payload);
          if (parsed && typeof parsed === "object") {
            if (typeof parsed.text === "string") {
              const normalizedText =
                parsed.text.includes("Lỗi kết nối AI: null") ?
                  "Không thể kết nối tới cổng AI (chưa cấu hình API key hoặc cổng 9Router cục bộ không hoạt động). Vui lòng mở AI Settings ở menu góc dưới bên trái để cấu hình."
                : parsed.text;
              fullReply += normalizedText;
              onChunk?.(normalizedText);
            } else if (parsed.fullContent) {
              fullReply = parsed.fullContent;
            }
          } else if (typeof parsed === "string") {
            fullReply += parsed;
            onChunk?.(parsed);
          }
        } catch {
          if (payload) {
            fullReply += payload;
            onChunk?.(payload);
          }
        }
      }
    }
  }

  return {
    reply:
      fullReply ||
      "I have processed your query and saved notes to your learning space.",
  };
}
