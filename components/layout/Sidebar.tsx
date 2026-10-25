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
  sidebarCollapsed = false,
  onToggleCollapse,
}: {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  sidebarWidth: number;
  setSidebarWidth: (w: number | ((w: number) => number)) => void;
  setResizing: (r: boolean) => void;
  sidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
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
  user: UserDto | null;
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
        {/* Notion-style Header: Workspace logo on left, collapse button on right */}
        <div className="sidebar-tools">
          <span
            className="sidebar-wordmark cursor-pointer"
            onClick={() => onNavigate("Notes")}
          >
            margin.
          </span>

          <Button
            className="icon-button"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            onClick={() => {
              if (mobileOpen) {
                setMobileOpen(false);
              } else if (onToggleCollapse) {
                onToggleCollapse();
              } else {
                setMobileOpen(false);
              }
            }}
          >
            <PanelLeftClose size={18} />
          </Button>
        </div>

        {/* Notion-style Quick Actions */}
        <div className="mb-4 flex flex-col gap-0.5">
          <button
            type="button"
            className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-xs font-medium transition-colors ${
              currentView === "Chat" ?
                "bg-[var(--hover)] font-semibold text-[var(--ink)]"
              : "text-[var(--secondary)] hover:bg-[var(--hover)] hover:text-[var(--ink)]"
            }`}
            onClick={() =>
              onNavigate(currentView === "Chat" ? "Notes" : "Chat")
            }
          >
            {currentView === "Chat" ?
              <>
                <BookOpenText size={16} />
                <span>Back to notes</span>
              </>
            : <>
                <MessageCircle size={16} />
                <span>AI Companion</span>
              </>
            }
          </button>

          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-xs font-medium text-[var(--secondary)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--ink)]"
            onClick={() => {
              if (currentView === "Chat") {
                onNewChat();
              } else {
                onCreateNewNote();
              }
            }}
          >
            <SquarePen size={16} />
            <span>{currentView === "Chat" ? "New chat" : "New note"}</span>
          </button>
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
