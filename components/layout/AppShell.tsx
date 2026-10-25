"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { CSSProperties } from "react";

import type {
  ChatThread,
  ConflictNote,
  NavView,
  NoteOffline,
  PopoverSelection,
  TopicOffline,
  UserDto,
  WordWithContexts,
} from "~/types";

import { ChatWorkspace } from "~/components/chat/ChatWorkspace";
import { AiSettingsModal } from "~/components/modals/AiSettingsModal";
import { AuthModal } from "~/components/modals/AuthModal";
import { CreateModal } from "~/components/modals/CreateModal";
import { HelpModal } from "~/components/modals/HelpModal";
import { ManageModal } from "~/components/modals/ManageModal";
import { SyncConflictModal } from "~/components/modals/SyncConflictModal";
import { NotesWorkspace } from "~/components/notes/NotesWorkspace";
import { WordPopover } from "~/components/popovers/WordPopover";
import { ProgressPage } from "~/components/progress/ProgressPage";
import { ReviewPage } from "~/components/review/ReviewPage";
import { Toast } from "~/components/ui";
import { VocabularyPage } from "~/components/vocabulary/VocabularyPage";
import { db } from "~/lib/db";
import { cleanLegacyMockData } from "~/lib/demoData";
import { triggerBatchSync } from "~/lib/syncManager";
import { getMeApi, logoutApi } from "~/services/auth";
import { fetchConversationsApi } from "~/services/chat";
import { deleteNoteApi, fetchNotesApi, upsertNoteApi } from "~/services/notes";
import { fetchProgressDashboardApi } from "~/services/progress";
import { fetchDueCardsWithTotalApi } from "~/services/review";
import {
  createTopicApi,
  deleteTopicApi,
  fetchTopicsApi,
  updateTopicApi,
} from "~/services/topics";
import { captureWordContext, fetchWordsWithContexts } from "~/services/words";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const initialChatsData: ChatThread[] = [];

export function AppShell() {
  const router = useRouter();

  // Theme & layout state
  const [dark, setDark] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(244);
  const [resizing, setResizing] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  // Navigation
  const [currentView, setCurrentView] = useState<NavView>("Notes");

  // Core Data
  const [topics, setTopics] = useState<TopicOffline[]>([]);
  const [notes, setNotes] = useState<NoteOffline[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [savedWords, setSavedWords] = useState<WordWithContexts[]>([]);
  const [collapsedTopics, setCollapsedTopics] = useState<string[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [syncStatus, setSyncStatus] = useState<
    "synced" | "offline" | "syncing" | "pending"
  >("synced");
  const [user, setUser] = useState<UserDto | null>(null);

  // Chat state
  const [chats, setChats] = useState<ChatThread[]>(initialChatsData);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Vocabulary view state
  const [expandedWordId, setExpandedWordId] = useState<string | null>(null);

  // Popover & Toast
  const [selection, setSelection] = useState<PopoverSelection | null>(null);
  const [toastMessage, setToastMessage] = useState("");

  // Modals
  const [createModal, setCreateModal] = useState<{
    open: boolean;
    type: "topic" | "note";
    parentTopicId?: string;
    parentTopicName?: string;
  }>({ open: false, type: "topic" });

  const [manageModal, setManageModal] = useState<{
    open: boolean;
    type: "topic" | "note";
    item: any;
  }>({ open: false, type: "topic", item: null });

  const [aiSettingsOpen, setAiSettingsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [conflictModal, setConflictModal] = useState<{
    open: boolean;
    localNote?: ConflictNote;
    cloudNote?: ConflictNote;
  }>({ open: false });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  // Theme synchronization with document element
  useEffect(() => {
    const isDark =
      localStorage.getItem("margin_theme") === "dark" ||
      (!localStorage.getItem("margin_theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Responsive sidebar: 14-inch laptop screens (<= 1440px) collapse sidebar by default, large screens show both
  useEffect(() => {
    let lastWidth = window.innerWidth;
    // Initial mount check for 14-inch screen
    if (window.innerWidth <= 1440) {
      setSidebarCollapsed(true);
    } else {
      setSidebarCollapsed(false);
    }

    const handleResize = () => {
      const currentWidth = window.innerWidth;
      const wasAbove = lastWidth > 1440;
      const isAbove = currentWidth > 1440;

      if (wasAbove !== isAbove) {
        setSidebarCollapsed(!isAbove);
      }
      lastWidth = currentWidth;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        setSidebarCollapsed((prev) => !prev);
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleToggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("margin_theme", next ? "dark" : "light");
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Automatically dismiss floating WordPopover when navigating away or switching notes
  useEffect(() => {
    setSelection(null);
  }, [currentView, activeNoteId]);

  // Reload all offline data
  // Reload all real data from backend/offline storage
  const loadData = useCallback(async () => {
    try {
      await cleanLegacyMockData();

      const [
        loadedTopics,
        loadedNotes,
        wordsWithContexts,
        dueSummary,
        prog,
        convs,
      ] = await Promise.all([
        fetchTopicsApi(),
        fetchNotesApi(),
        fetchWordsWithContexts(),
        fetchDueCardsWithTotalApi(15).catch(() => ({ cards: [], totalDue: 0 })),
        fetchProgressDashboardApi().catch(() => null),
        fetchConversationsApi().catch(() => []),
      ]);

      setTopics(loadedTopics);
      setNotes(loadedNotes);
      setSavedWords(wordsWithContexts);
      setDueCount(dueSummary.totalDue);
      if (prog) {
        setStreakDays(prog.streakDays);
      }
      if (Array.isArray(convs) && convs.length > 0) {
        setChats(convs);
        if (!activeChatId && convs[0]) {
          setActiveChatId(convs[0].id);
        }
      }

      // Default active note if not set
      if (!activeNoteId && loadedNotes[0]) {
        setActiveNoteId(loadedNotes[0].id);
      }
    } catch (err) {
      console.error("Failed to load initial data:", err);
    }
  }, [activeNoteId, activeChatId]);

  // Initial mount: load real data & profile
  useEffect(() => {
    const initAuthAndData = async () => {
      await loadData();

      try {
        const me = await getMeApi();
        if (me) {
          setUser(me);
        } else if (
          typeof window !== "undefined" &&
          localStorage.getItem("margin_guest_mode") === "true"
        ) {
          setUser({
            username: "guest",
            name: "Guest Reader",
            role: "ROLE_GUEST",
          });
        } else {
          setUser(null);
        }
      } catch {
        if (
          typeof window !== "undefined" &&
          localStorage.getItem("margin_guest_mode") === "true"
        ) {
          setUser({
            username: "guest",
            name: "Guest Reader",
            role: "ROLE_GUEST",
          });
        } else {
          setUser(null);
        }
      }
    };

    initAuthAndData();

    // Online/Offline detection
    const handleOnline = () => setSyncStatus("synced");
    const handleOffline = () => setSyncStatus("offline");
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (!navigator.onLine) {
      setSyncStatus("offline");
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [loadData]);

  // Active note reference
  const activeNote =
    notes.find((n) => n.id === activeNoteId) || notes[0] || null;
  const activeTopic =
    activeNote ? topics.find((t) => t.id === activeNote.topicId) : null;

  // Actions
  const handleSaveNoteContent = async (updated: {
    title: string;
    content: string;
  }) => {
    if (!activeNote) return;
    const noteId = activeNote.id;
    await upsertNoteApi({
      id: noteId,
      title: updated.title,
      content: updated.content,
      topicId: activeNote.topicId,
      createdAtMs: activeNote.createdAtMs,
    });
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, ...updated } : n)),
    );
    showToast("Note saved");
  };

  const handleCreateTopic = async (name: string) => {
    const newTopic = await createTopicApi(name);
    setTopics((prev) => [...prev, newTopic]);
    showToast(`Topic "${name}" created`);
  };

  const handleCreateNote = async (title: string, topicId?: string) => {
    const newNote = await upsertNoteApi({
      title,
      content: "A new thought begins here. Select Edit note to start writing.",
      topicId: topicId || topics[0]?.id || "",
    });
    setNotes((prev) => [...prev, newNote]);
    setActiveNoteId(newNote.id);
    setCurrentView("Notes");
    showToast("A fresh note was created");
  };

  const handleSaveWordContext = async (data: {
    text: string;
    sentence: string;
    meaning: string;
    translation: string;
    ipa?: string;
    pos?: string;
  }) => {
    if (!activeNote) return;
    const res = await captureWordContext({
      word: data.text,
      sentence: data.sentence,
      noteId: activeNote.id,
      noteTitle: activeNote.title,
      translation: data.translation,
      meaning: data.meaning,
      ipa: data.ipa,
      pos: data.pos,
    });

    const refreshedWords = await fetchWordsWithContexts();
    setSavedWords(refreshedWords);

    if (res.isNewWord) {
      showToast(`Saved “${data.text}” to your vocabulary`);
    } else {
      showToast(`Added a new context for “${data.text}”`);
    }
  };

  const handleTriggerSync = async () => {
    setSyncStatus("syncing");
    try {
      if (navigator.onLine) {
        const res = await triggerBatchSync();
        if (res.status === "SUCCESS") {
          setSyncStatus("synced");
          showToast("All changes synchronized with server");
          await loadData();
          return;
        }
      }
      setSyncStatus("offline");
      showToast("Offline mode: changes saved locally");
    } catch {
      setSyncStatus("offline");
      showToast("Offline mode: changes saved locally");
    }
  };

  return (
    <div
      className={`app ${dark ? "dark" : ""} ${
        resizing ? "sidebar-resizing" : ""
      } ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
      style={
        {
          "--sidebar-width": `${sidebarCollapsed ? 0 : sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        sidebarCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        currentView={currentView}
        onNavigate={setCurrentView}
        sidebarWidth={sidebarWidth}
        setSidebarWidth={setSidebarWidth}
        setResizing={setResizing}
        // Topic tree
        topics={topics}
        notes={notes}
        activeNoteId={activeNoteId}
        collapsedTopics={collapsedTopics}
        setCollapsedTopics={setCollapsedTopics}
        onSelectNote={(id) => {
          setActiveNoteId(id);
          setCurrentView("Notes");
        }}
        onCreateTopic={() => setCreateModal({ open: true, type: "topic" })}
        onCreateNoteInTopic={(topicId) => {
          const t = topics.find((item) => item.id === topicId);
          setCreateModal({
            open: true,
            type: "note",
            parentTopicId: topicId,
            parentTopicName: t?.name,
          });
        }}
        onManageTopic={(topic) =>
          setManageModal({ open: true, type: "topic", item: topic })
        }
        onCreateNewNote={() => setCreateModal({ open: true, type: "note" })}
        // Chat
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={(id) => {
          setActiveChatId(id);
          setCurrentView("Chat");
        }}
        onNewChat={() => {
          setActiveChatId(null);
          setCurrentView("Chat");
        }}
        onDeleteChat={(id) => {
          setChats((prev) => prev.filter((c) => c.id !== id));
          if (activeChatId === id) setActiveChatId(null);
        }}
        // Profile
        accountOpen={accountOpen}
        setAccountOpen={setAccountOpen}
        user={user}
        dueCount={dueCount}
        dark={dark}
        onToggleDark={handleToggleDark}
        onOpenAiSettings={() => setAiSettingsOpen(true)}
        onOpenSync={handleTriggerSync}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={async () => {
          await logoutApi();
          if (typeof window !== "undefined") {
            localStorage.removeItem("margin_guest_mode");
          }
          setUser(null);
          showToast("Signed out");
          router.replace("/login");
        }}
      />

      <main className="main">
        <Topbar
          currentView={currentView}
          topicName={activeTopic?.name}
          noteTitle={activeNote?.title}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          streakDays={streakDays}
          syncStatus={syncStatus}
          onTriggerSync={handleTriggerSync}
          dark={dark}
          onToggleDark={handleToggleDark}
        />

        {currentView === "Notes" && (
          <NotesWorkspace
            note={activeNote}
            savedWords={savedWords}
            onSaveNote={handleSaveNoteContent}
            onManageNote={() => {
              if (activeNote) {
                setManageModal({
                  open: true,
                  type: "note",
                  item: activeNote,
                });
              }
            }}
            onCreateNewNote={() => setCreateModal({ open: true, type: "note" })}
            onOpenSelection={setSelection}
            onNavigateVocab={() => setCurrentView("Vocabulary")}
            onSelectWord={(wordId) => {
              setExpandedWordId(wordId);
              setCurrentView("Vocabulary");
            }}
          />
        )}

        {currentView === "Chat" && (
          <ChatWorkspace
            chats={chats}
            setChats={setChats}
            activeId={activeChatId}
            setActiveId={setActiveChatId}
          />
        )}

        {currentView === "Vocabulary" && (
          <VocabularyPage
            words={savedWords}
            expandedWordId={expandedWordId}
            setExpandedWordId={setExpandedWordId}
            onNavigateNote={(noteId) => {
              setActiveNoteId(noteId);
              setCurrentView("Notes");
            }}
          />
        )}

        {currentView === "Review" && (
          <ReviewPage
            onNavigateNotes={() => setCurrentView("Notes")}
            onNavigateProgress={() => setCurrentView("Progress")}
            onSessionReviewed={loadData}
          />
        )}

        {currentView === "Progress" && (
          <ProgressPage onNavigateReview={() => setCurrentView("Review")} />
        )}
      </main>

      {/* Floating Word Selection Popover */}
      {currentView === "Notes" && selection && (
        <WordPopover
          selection={selection}
          setSelection={setSelection}
          onClose={() => setSelection(null)}
          existingWord={(() => {
            const matched = savedWords.find(
              (w) => w.text.toLowerCase() === selection.text.toLowerCase(),
            );
            if (!matched) return null;
            return {
              id: matched.id,
              text: selection.text,
              meaning: matched.meaning || matched.translation || "",
              contextsCount: matched.contexts.length,
            };
          })()}
          onSaveWord={handleSaveWordContext}
        />
      )}

      {/* Modals */}
      <CreateModal
        isOpen={createModal.open}
        type={createModal.type}
        parentTopicId={createModal.parentTopicId}
        parentTopicName={createModal.parentTopicName}
        onClose={() => setCreateModal((prev) => ({ ...prev, open: false }))}
        onCreateTopic={handleCreateTopic}
        onCreateNote={handleCreateNote}
      />

      <ManageModal
        isOpen={manageModal.open}
        type={manageModal.type}
        initialName={
          manageModal.type === "topic" ?
            manageModal.item?.name || ""
          : manageModal.item?.title || ""
        }
        onClose={() => setManageModal((prev) => ({ ...prev, open: false }))}
        onSaveName={async (newName) => {
          if (manageModal.type === "topic") {
            await updateTopicApi(manageModal.item.id, newName);
            setTopics((prev) =>
              prev.map((t) =>
                t.id === manageModal.item.id ? { ...t, name: newName } : t,
              ),
            );
            showToast("Topic name updated");
          } else {
            await upsertNoteApi({
              ...manageModal.item,
              title: newName,
            });
            setNotes((prev) =>
              prev.map((n) =>
                n.id === manageModal.item.id ? { ...n, title: newName } : n,
              ),
            );
            showToast("Note title updated");
          }
        }}
        onDelete={async () => {
          if (manageModal.type === "topic") {
            await deleteTopicApi(manageModal.item.id);
            setTopics((prev) =>
              prev.filter((t) => t.id !== manageModal.item.id),
            );
            showToast("Topic deleted");
          } else {
            await deleteNoteApi(manageModal.item.id);
            setNotes((prev) =>
              prev.filter((n) => n.id !== manageModal.item.id),
            );
            showToast("Note deleted");
          }
        }}
      />

      <AiSettingsModal
        isOpen={aiSettingsOpen}
        onClose={() => setAiSettingsOpen(false)}
        onSaved={() => showToast("AI settings updated")}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(loggedUser) => {
          setUser(loggedUser);
          showToast(`Welcome back, ${loggedUser.username}!`);
        }}
      />

      <HelpModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />

      {conflictModal.open &&
        conflictModal.localNote &&
        conflictModal.cloudNote && (
          <SyncConflictModal
            isOpen={conflictModal.open}
            localNote={conflictModal.localNote}
            cloudNote={conflictModal.cloudNote}
            onClose={() => setConflictModal({ open: false })}
            onResolve={(choice) => {
              showToast(
                choice === "local" ?
                  "Kept device version"
                : "Applied cloud version",
              );
            }}
          />
        )}

      {/* Feedback Toast */}
      {toastMessage && (
        <Toast message={toastMessage} onDismiss={() => setToastMessage("")} />
      )}
    </div>
  );
}
