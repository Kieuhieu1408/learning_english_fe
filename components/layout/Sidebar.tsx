"use client";

import React from "react";

import {
  BookOpenText,
  MessageCircle,
  PanelLeftClose,
  SquarePen,
} from "lucide-react";

import type {
  ChatThread,
  NavView,
  NoteOffline,
  TopicOffline,
  UserDto,
} from "~/types";

import { ChatHistory } from "~/components/chat/ChatHistory";
import { Button } from "~/components/ui";

import { ProfileMenu } from "./ProfileMenu";
import { SidebarResize } from "./SidebarResize";
import { TopicTree } from "./TopicTree";

export function Sidebar({
  mobileOpen,
  setMobileOpen,
  currentView,
  onNavigate,
  sidebarWidth,
  setSidebarWidth,
  setResizing,
  // Topic tree props
  topics,
  notes,
  activeNoteId,
  collapsedTopics,
  setCollapsedTopics,
  onSelectNote,
  onCreateTopic,
  onCreateNoteInTopic,
  onManageTopic,
  onCreateNewNote,
  // Chat props
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  // Profile props
  accountOpen,
  setAccountOpen,
  user,
  dueCount,
  dark,
  onToggleDark,
  onOpenAiSettings,
  onOpenSync,
  onOpenAuth,
  onLogout,
}: {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  sidebarWidth: number;
  setSidebarWidth: (w: number | ((w: number) => number)) => void;
  setResizing: (r: boolean) => void;
  // Topics
  topics: TopicOffline[];
  notes: NoteOffline[];
  activeNoteId: string | null;
  collapsedTopics: string[];
  setCollapsedTopics: React.Dispatch<React.SetStateAction<string[]>>;
  onSelectNote: (noteId: string) => void;
  onCreateTopic: () => void;
  onCreateNoteInTopic: (topicId: string) => void;
  onManageTopic: (topic: TopicOffline) => void;
  onCreateNewNote: () => void;
  // Chat
  chats: ChatThread[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  // Profile
  accountOpen: boolean;
  setAccountOpen: (open: boolean) => void;
  user: { name?: string; email?: string } | null;
  dueCount: number;
  dark: boolean;
  onToggleDark: () => void;
  onOpenAiSettings: () => void;
  onOpenSync?: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}) {
  return (
    <>
      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-tools">
          <Button
            className="icon-button"
            aria-label="Close sidebar"
            onClick={() => setMobileOpen(false)}
          >
            <PanelLeftClose size={19} />
          </Button>

          <span
            className="sidebar-wordmark cursor-pointer"
            onClick={() => onNavigate("Notes")}
          >
            margin.
          </span>

          <Button
            className={`icon-button ${
              currentView === "Chat" ? "chat-mode-active" : ""
            }`}
            aria-label={
              currentView === "Chat" ? "Back to notes" : "Open chatbot"
            }
            title={
              currentView === "Chat" ? "Back to notes" : (
                "Chat with learning companion"
              )
            }
            onClick={() =>
              onNavigate(currentView === "Chat" ? "Notes" : "Chat")
            }
          >
            {currentView === "Chat" ?
              <BookOpenText size={19} />
            : <MessageCircle size={19} />}
          </Button>

          <Button
            className="icon-button"
            aria-label={currentView === "Chat" ? "New chat" : "Create note"}
            title={currentView === "Chat" ? "New chat" : "Create note"}
            onClick={() => {
              if (currentView === "Chat") {
                onNewChat();
              } else {
                onCreateNewNote();
              }
            }}
          >
            <SquarePen size={19} />
          </Button>
        </div>

        {currentView === "Chat" ?
          <ChatHistory
            chats={chats}
            activeId={activeChatId}
            onSelectChat={onSelectChat}
            onNewChat={onNewChat}
            onDeleteChat={onDeleteChat}
            closeSidebar={() => setMobileOpen(false)}
          />
        : <TopicTree
            topics={topics}
            notes={notes}
            activeNoteId={activeNoteId}
            collapsedTopics={collapsedTopics}
            setCollapsedTopics={setCollapsedTopics}
            onSelectNote={(id) => {
              onSelectNote(id);
              setMobileOpen(false);
            }}
            onCreateTopic={onCreateTopic}
            onCreateNoteInTopic={onCreateNoteInTopic}
            onManageTopic={onManageTopic}
            onCreateNewNote={onCreateNewNote}
          />
        }

        <ProfileMenu
          accountOpen={accountOpen}
          setAccountOpen={setAccountOpen}
          user={user}
          currentView={currentView}
          onNavigate={onNavigate}
          dueCount={dueCount}
          dark={dark}
          onToggleDark={onToggleDark}
          onOpenAiSettings={onOpenAiSettings}
          onOpenSync={onOpenSync}
          onOpenAuth={onOpenAuth}
          onLogout={onLogout}
        />

        <SidebarResize
          sidebarWidth={sidebarWidth}
          setSidebarWidth={setSidebarWidth}
          setResizing={setResizing}
        />
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
