"use client";

import React, { useEffect, useRef, useState } from "react";

import { ArrowUp, BookOpen, MessageCircle, Sparkles } from "lucide-react";

import type { ChatThread } from "./ChatHistory";

import { Button, Heading, Input } from "~/components/ui";
import { sendChatMessageApi } from "~/services/chat";

export function ChatWorkspace({
  chats,
  setChats,
  activeId,
  setActiveId,
}: {
  chats: ChatThread[];
  setChats: React.Dispatch<React.SetStateAction<ChatThread[]>>;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
}) {
  const [input, setInput] = useState("");
  const [isPending, setIsPending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const activeChat = chats.find((c) => c.id === activeId);

  useEffect(() => {
    endRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [activeChat?.messages.length, activeId, isPending]);

  const handleSend = async (customPrompt?: string) => {
    const text = (customPrompt || input).trim();
    if (!text || isPending) return;

    let targetId = activeId;
    let currentThread = activeChat;

    if (!targetId || !currentThread) {
      targetId = crypto.randomUUID();
      const newThread: ChatThread = {
        id: targetId,
        title: text.length > 38 ? text.slice(0, 38) + "…" : text,
        messages: [{ role: "user", text }],
      };
      setChats((prev) => [newThread, ...prev]);
      setActiveId(targetId);
      currentThread = newThread;
    } else {
      setChats((prev) =>
        prev.map((c) =>
          c.id === targetId ?
            { ...c, messages: [...c.messages, { role: "user", text }] }
          : c,
        ),
      );
    }

    setInput("");
    setIsPending(true);

    try {
      const history = currentThread?.messages || [];
      const reply = await sendChatMessageApi({
        message: text,
        conversationHistory: history,
      });

      setChats((prev) =>
        prev.map((c) =>
          c.id === targetId ?
            {
              ...c,
              messages: [
                ...c.messages,
                { role: "assistant", text: reply.reply },
              ],
            }
          : c,
        ),
      );
    } catch {
      setChats((prev) =>
        prev.map((c) =>
          c.id === targetId ?
            {
              ...c,
              messages: [
                ...c.messages,
                {
                  role: "assistant",
                  text: "Sorry, I encountered an issue processing your request.",
                },
              ],
            }
          : c,
        ),
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <section
      className={`chat-workspace ${activeChat ? "has-messages" : ""}`}
      aria-label="Learning companion"
    >
      <div className="chat-scroll">
        {activeChat ?
          <div
            className="chat-messages"
            role="log"
            aria-label="Conversation"
            aria-live="polite"
          >
            {activeChat.messages.map((m, i) => (
              <div className={`chat-message ${m.role}`} key={i}>
                {m.role === "assistant" && (
                  <div className="chat-assistant-avatar">
                    <Sparkles size={17} />
                  </div>
                )}
                <div>
                  <span className="chat-speaker">
                    {m.role === "user" ? "You" : "Margin companion"}
                  </span>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
            ))}

            {isPending && (
              <div className="chat-pending" role="status">
                <Sparkles size={16} />
                Thinking and preparing a response…
              </div>
            )}
            <div ref={endRef} />
          </div>
        : <div className="chat-welcome">
            <div className="chat-welcome-icon">
              <Sparkles size={26} />
            </div>
            <span className="page-eyebrow">YOUR LEARNING COMPANION</span>
            <Heading>
              A little curiosity.
              <br />A new conversation.
            </Heading>
            <p>
              Explore a word, revisit an idea, or make room for a little
              practice.
            </p>
            <div className="chat-suggestions">
              {[
                {
                  icon: BookOpen,
                  title: "Explore a word",
                  text: "What does cultivate mean?",
                },
                {
                  icon: MessageCircle,
                  title: "Talk about a note",
                  text: "Summarize The art of paying attention",
                },
                {
                  icon: Sparkles,
                  title: "Practice a little",
                  text: "Give me a vocabulary exercise",
                },
              ].map(({ icon: Icon, title, text }) => (
                <Button
                  key={title}
                  onClick={() => handleSend(text)}
                  disabled={isPending}
                >
                  <Icon size={17} />
                  <strong>{title}</strong>
                  <span>{text}</span>
                </Button>
              ))}
            </div>
          </div>
        }
      </div>

      <div className="chat-composer-area">
        <form
          className="chat-composer"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <Input
            aria-label="Message learning companion"
            placeholder="Ask about a word or an idea…"
            maxLength={2000}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button
            className="primary chat-send"
            type="submit"
            aria-label="Send message"
            disabled={!input.trim() || isPending}
          >
            <ArrowUp size={18} />
          </Button>
        </form>
        <p className="chat-disclaimer">
          Editorial AI companion · Online backend with local intelligent
          fallback.
        </p>
      </div>
    </section>
  );
}
