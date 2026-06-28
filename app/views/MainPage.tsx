"use client";

import React, { useCallback, useEffect, useState } from "react";

import { useLiveQuery } from "dexie-react-hooks";
import { useTheme } from "next-themes";

import type { ThemeOption } from "../../services/user";

import ConflictResolverModal from "../../components/ConflictResolverModal";
import DashboardCounters from "../../components/DashboardCounters";
import Leftbar from "../../components/Leftbar";
import NotionEditor from "../../components/NotionEditor";
import QuizEngine from "../../components/QuizEngine";
import { db } from "../../lib/db";
import { triggerBatchSync } from "../../lib/syncManager";
import { fetchAppConfig } from "../../services/user";

interface MainPageProps {
  onOpenSettings: () => void;
  onOpenTest: () => void;
}

export default function MainPage({
  onOpenSettings,
  onOpenTest,
}: MainPageProps) {
  const [activeTab, setActiveTab] = useState<"editor" | "quiz">("editor");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "offline">(
    "idle",
  );

  // Conflict resolution states
  const [isConflictOpen, setIsConflictOpen] = useState(false);
  const [conflictLocal, setConflictLocal] = useState<any>(null);
  const [conflictRemote, setConflictRemote] = useState<any>(null);
  const [conflictResolveCallback, setConflictResolveCallback] = useState<
    ((decision: "local" | "remote") => void) | null
  >(null);

  const handleSync = useCallback(async () => {
    setSyncStatus("syncing");

    try {
      const remoteConfig = await fetchAppConfig();
      if (remoteConfig) {
        if (remoteConfig.themeColor) {
          await db.configs.put({
            key: "themeColor",
            value: remoteConfig.themeColor,
          });
        }
        if (remoteConfig.themeMode) {
          await db.configs.put({
            key: "themeMode",
            value: remoteConfig.themeMode,
          });
        }
        if (remoteConfig.availableThemes) {
          await db.configs.put({
            key: "availableThemes",
            value: remoteConfig.availableThemes as any,
          });
        }
      }
    } catch (err) {
      console.error("Failed to sync app config:", err);
    }

    const result = await triggerBatchSync();
    if (result.status === "SUCCESS") {
      setSyncStatus("idle");
    } else if (result.status === "OFFLINE_MODE") {
      setSyncStatus("offline");
    } else {
      setSyncStatus("idle");
    }
  }, []);

  const syncQueueLength = useLiveQuery(() => db.syncQueue.count()) || 0;
  const activeThemeColor =
    useLiveQuery(() =>
      db.configs.get("themeColor").then((res) => res?.value || "midnight"),
    ) || "midnight";
  const savedThemeMode = useLiveQuery(() =>
    db.configs.get("themeMode").then((res) => res?.value),
  );
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (savedThemeMode && savedThemeMode !== theme) {
      setTheme(savedThemeMode);
    }
  }, [savedThemeMode, setTheme, theme]);

  // Auto-sync on mount
  useEffect(() => {
    handleSync();
  }, [handleSync]);

  // Auto-sync when there are new changes in the queue (debounced)
  useEffect(() => {
    if (syncQueueLength > 0) {
      const timer = setTimeout(() => {
        handleSync();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [syncQueueLength, handleSync]);

  // Auto-sync when browser goes back online
  useEffect(() => {
    const handleOnline = () => {
      handleSync();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [handleSync]);

  const handleDeleteNote = async (id: string) => {
    await db.notes.delete(id);
    await db.syncQueue.put({
      entityType: "note",
      entityId: id,
      action: "DELETE",
      payload: "",
      timestamp: Date.now(),
    });
    setSelectedNoteId(null);
  };

  const availableThemes = useLiveQuery(() =>
    db.configs
      .get("availableThemes")
      .then((res) => res?.value as ThemeOption[] | undefined),
  );

  const getThemeBgClass = () => {
    const isDark = theme === "dark";

    if (availableThemes && activeThemeColor) {
      const found = availableThemes.find((t) => t.id === activeThemeColor);
      if (found) {
        return isDark ? found.darkBgClass : found.bgClass;
      }
    }

    // Fallback defaults if not yet synced
    if (isDark) {
      return "bg-slate-950";
    }

    switch (activeThemeColor) {
      case "sky":
        return "bg-sky-50";
      case "lavender":
        return "bg-purple-50";
      case "mint":
        return "bg-emerald-50";
      case "peach":
        return "bg-orange-50";
      case "rose":
        return "bg-rose-50";
      case "slate":
        return "bg-slate-50";
      case "midnight":
      default:
        return "bg-white";
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white font-sans text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      {/* Dynamic top header bar spanning full width */}
      <DashboardCounters
        currentTab={activeTab}
        onTabChange={setActiveTab}
        syncStatus={syncStatus}
        onSync={handleSync}
      />

      {/* Main Content Area (Sidebar + Content Panel) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Topics navigation */}
        <Leftbar
          onSelectNote={setSelectedNoteId}
          activeNoteId={selectedNoteId}
          onSync={handleSync}
          syncStatus={syncStatus}
          onOpenSettings={onOpenSettings}
          onOpenTest={onOpenTest}
        />

        {/* Content body switcher with dynamic theme background */}
        <div
          className={`flex flex-1 overflow-hidden transition-colors duration-300 ${getThemeBgClass()}`}
        >
          {activeTab === "editor" ?
            <NotionEditor
              noteId={selectedNoteId}
              onDeleteNote={handleDeleteNote}
            />
          : <QuizEngine />}
        </div>
      </div>

      {/* Popups */}
      <ConflictResolverModal
        isOpen={isConflictOpen}
        localVersion={conflictLocal}
        remoteVersion={conflictRemote}
        onResolve={(chosen) => {
          if (conflictResolveCallback) conflictResolveCallback(chosen);
          setIsConflictOpen(false);
        }}
        onClose={() => setIsConflictOpen(false)}
      />
    </div>
  );
}
