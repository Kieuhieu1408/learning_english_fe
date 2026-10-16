"use client";

import React from "react";

import { MessageCircle, Plus, Trash2 } from "lucide-react";

import type { ChatThread } from "~/types";

import { Button } from "~/components/ui";

export type { ChatThread };

export function ChatHistory({
  chats,
  activeId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  closeSidebar,
}: {
  chats: ChatThread[];
  activeId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  closeSidebar: () => void;
}) {
  return (
    <div className="chat-history">
      <Button
        className="new-chat"
        onClick={() => {
          onNewChat();
          closeSidebar();
        }}
      >
        <Plus size={16} />
        New chat
      </Button>

      <div className="section-label">Recent chats</div>

      <div className="chat-history-list">
        {chats.map((c) => (
          <div
            className={`chat-history-row ${
              activeId === c.id ? "selected" : ""
            }`}
            key={c.id}
          >
            <Button
              className="chat-history-link"
              onClick={() => {
                onSelectChat(c.id);
                closeSidebar();
              }}
            >
              <MessageCircle size={15} />
              <span>{c.title}</span>
            </Button>
            <Button
              className="icon-button chat-delete"
              aria-label={`Delete chat ${c.title}`}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChat(c.id);
              }}
            >
              <Trash2 size={13} />
            </Button>
          </div>
        ))}
      </div>

      {!chats.length && (
        <p className="chat-history-empty">
          Your conversations will appear here.
        </p>
      )}

      <p className="chat-history-note">
        A small room for your curiosity.
        <br />
        Offline-ready with intelligent fallback.
      </p>
    </div>
  );
}
