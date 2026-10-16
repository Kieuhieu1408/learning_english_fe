"use client";

import React, { useCallback, useEffect, useState } from "react";

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
import { ensureSeedData } from "~/lib/demoData";
import { triggerBatchSync } from "~/lib/syncManager";
import { getMeApi, logoutApi } from "~/services/auth";
import { deleteNoteApi, fetchNotesApi, upsertNoteApi } from "~/services/notes";
import { fetchProgressDashboardApi } from "~/services/progress";
import { fetchDueCardsApi } from "~/services/review";
import {
  createTopicApi,
  deleteTopicApi,
  fetchTopicsApi,
  updateTopicApi,
} from "~/services/topics";
import { captureWordContext, fetchWordsWithContexts } from "~/services/words";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const initialChatsData: ChatThread[] = [
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

export function AppShell() {
  // Theme & layout state
  const [dark, setDark] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(244);
  const [resizing, setResizing] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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
  const [streakDays, setStreakDays] = useState(4);
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

  // Reload all offline data
  const loadData = useCallback(async () => {
    try {
      await ensureSeedData();

      const [loadedTopics, loadedNotes, wordsWithContexts, dueCards, prog] =
        await Promise.all([
          fetchTopicsApi(),
          fetchNotesApi(),
          fetchWordsWithContexts(),
          fetchDueCardsApi(15).catch(() => []),
          fetchProgressDashboardApi().catch(() => null),
        ]);

      setTopics(loadedTopics);
      setNotes(loadedNotes);
      setSavedWords(wordsWithContexts);
      setDueCount(dueCards.length);
      if (prog) {
        setStreakDays(prog.streakDays);
      }

      // Default active note if not set
      if (!activeNoteId && loadedNotes[0]) {
        setActiveNoteId(loadedNotes[0].id);
      }
    } catch (err) {
      console.error("Failed to load initial data:", err);
    }
  }, [activeNoteId]);

  // Initial mount
  useEffect(() => {
    loadData();

    // Check user authentication
    getMeApi()
      .then((me) => setUser(me))
      .catch(() => setUser(null));

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
      }`}
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
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
          setUser(null);
          showToast("Signed out");
        }}
      />

      <main className="main">
        <Topbar
          currentView={currentView}
          topicName={activeTopic?.name}
          noteTitle={activeNote?.title}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
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

        <footer className="app-footer">
          <span>margin.</span>
          <span>Thoughtful english reading and vocabulary notes</span>
          <span>Offline-first</span>
        </footer>
      </main>

      {/* Floating Word Selection Popover */}
      {selection && (
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
