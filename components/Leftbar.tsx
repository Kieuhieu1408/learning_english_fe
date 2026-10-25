"use client";

import React, { useEffect, useState } from "react";

import { useLiveQuery } from "dexie-react-hooks";
import {
  Check,
  ChevronDown,
  ChevronRight,
  FileKey,
  FilePlus,
  FileText,
  Folder,
  FolderPlus,
  GraduationCap,
  Key,
  Lock,
  LogOut,
  Moon,
  RefreshCw,
  Settings,
  Shield,
  Sun,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";

import type { TopicOffline } from "../lib/db";
import type { ThemeOption } from "../services/user";

import { db } from "../lib/db";
import { queueLocalChange } from "../lib/syncManager";
import { logoutApi } from "../services/auth";
import { saveAppConfig } from "../services/user";

interface LeftbarProps {
  onSelectNote: (noteId: string) => void;
  activeNoteId: string | null;
  onSync: () => void;
  syncStatus: string;
  onOpenSettings?: () => void;
  onOpenTest?: () => void;
}

export default function Leftbar({
  onSelectNote,
  activeNoteId,
  onSync,
  syncStatus,
  onOpenSettings,
  onOpenTest,
}: LeftbarProps) {
  const topics = useLiveQuery(() => db.topics.toArray()) || [];
  const notes = useLiveQuery(() => db.notes.toArray()) || [];
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

  const handleSetThemeMode = async (mode: string) => {
    setTheme(mode);
    await db.configs.put({ key: "themeMode", value: mode });
    saveAppConfig({ themeMode: mode }).catch((err) =>
      console.error("Failed to save themeMode to backend:", err),
    );
  };

  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>(
    {},
  );
  const [newTopicName, setNewTopicName] = useState("");
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(true);
  const [username, setUsername] = useState("user@example.com");

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await db.transaction(
        "rw",
        [db.topics, db.notes, db.words, db.syncQueue, db.syncMetadata],
        async () => {
          await db.topics.clear();
          await db.notes.clear();
          await db.words.clear();
          await db.syncQueue.clear();
          await db.syncMetadata.clear();
        },
      );
    } catch (err) {
      console.error("Failed to clear local database on logout:", err);
    }
    await logoutApi();
    window.location.reload();
  };

  const toggleTopic = (topicId: string) => {
    setExpandedTopics((prev) => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;

    const newTopic: TopicOffline = {
      id: crypto.randomUUID(),
      name: newTopicName.trim(),
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
    };

    await db.topics.put(newTopic);
    await queueLocalChange("topic", newTopic.id, "CREATE", newTopic);
    setNewTopicName("");
    setShowAddTopic(false);
  };

  const handleAddNote = async (topicId: string) => {
    const newNote = {
      id: crypto.randomUUID(),
      topicId: topicId,
      title: "Untitled Note",
      content: "",
      version: 1,
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
    };

    await db.notes.put(newNote);
    await queueLocalChange("note", newNote.id, "CREATE", newNote);
    onSelectNote(newNote.id);
  };

  const handleSelectThemeColor = async (color: string) => {
    await db.configs.put({ key: "themeColor", value: color });
    saveAppConfig({ themeColor: color }).catch((err) =>
      console.error("Failed to save themeColor to backend:", err),
    );
  };

  const availableThemes = useLiveQuery(() =>
    db.configs
      .get("availableThemes")
      .then((res) => res?.value as ThemeOption[] | undefined),
  );

  const defaultThemeOptions = [
    {
      id: "midnight",
      name: "Midnight Navy",
      colors: ["bg-slate-900", "bg-slate-800", "bg-slate-700"],
      bgClass: "bg-white",
      darkBgClass: "bg-slate-950",
    },
    {
      id: "sky",
      name: "Sky Blue",
      colors: ["bg-sky-200", "bg-sky-300", "bg-sky-400"],
      bgClass: "bg-sky-50",
      darkBgClass: "bg-slate-950",
    },
    {
      id: "lavender",
      name: "Lavender",
      colors: ["bg-purple-200", "bg-purple-300", "bg-purple-400"],
      bgClass: "bg-purple-50",
      darkBgClass: "bg-slate-950",
    },
    {
      id: "mint",
      name: "Mint Green",
      colors: ["bg-emerald-200", "bg-emerald-300", "bg-emerald-400"],
      bgClass: "bg-emerald-50",
      darkBgClass: "bg-slate-950",
    },
    {
      id: "peach",
      name: "Peach",
      colors: ["bg-amber-200", "bg-amber-300", "bg-amber-400"],
      bgClass: "bg-orange-50",
      darkBgClass: "bg-slate-950",
    },
    {
      id: "rose",
      name: "Rose",
      colors: ["bg-rose-200", "bg-rose-300", "bg-rose-400"],
      bgClass: "bg-rose-50",
      darkBgClass: "bg-slate-950",
    },
    {
      id: "slate",
      name: "Slate Gray",
      colors: ["bg-slate-200", "bg-slate-300", "bg-slate-400"],
      bgClass: "bg-slate-50",
      darkBgClass: "bg-slate-950",
    },
  ];

  const themeOptions = availableThemes || defaultThemeOptions;

  return (
    <div className="relative z-10 flex h-full w-64 flex-shrink-0 flex-col justify-between border-r border-slate-200 bg-white text-slate-700 select-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
      {/* Accordion List */}
      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-xs font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
            Topics
          </span>
          <button
            onClick={() => setShowAddTopic(!showAddTopic)}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
            title="Add new topic"
          >
            <FolderPlus className="h-4 w-4" />
          </button>
        </div>

        {showAddTopic && (
          <form onSubmit={handleAddTopic} className="flex gap-1 px-2">
            <input
              type="text"
              placeholder="Topic name..."
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
            />
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-500"
            >
              Add
            </button>
          </form>
        )}

        <div className="space-y-1">
          {topics.map((topic) => {
            const isExpanded = expandedTopics[topic.id];
            const topicNotes = notes.filter((n) => n.topicId === topic.id);

            return (
              <div key={topic.id} className="space-y-0.5">
                {/* Topic Header */}
                <div className="group flex cursor-pointer items-center justify-between rounded-xl px-2 py-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50">
                  <div
                    className="flex flex-1 items-center gap-2"
                    onClick={() => toggleTopic(topic.id)}
                  >
                    {isExpanded ?
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                    : <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                    }
                    <Folder className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                    <span className="truncate text-sm font-bold text-slate-800 dark:text-slate-200">
                      {topic.name}
                    </span>
                  </div>
                  <button
                    onClick={() => handleAddNote(topic.id)}
                    className="rounded-lg p-1 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-white"
                    title="Add new note to topic"
                  >
                    <FilePlus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Topic Notes */}
                {isExpanded && (
                  <div className="ml-4 space-y-0.5 border-l border-slate-200 pl-6 dark:border-slate-800">
                    {topicNotes.length === 0 ?
                      <span className="block py-1 text-xs font-medium text-slate-400 dark:text-slate-600">
                        No notes yet
                      </span>
                    : topicNotes.map((note) => (
                        <div
                          key={note.id}
                          onClick={() => onSelectNote(note.id)}
                          className={`flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 transition-colors ${activeNoteId === note.id ? "bg-indigo-50 font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300" : "font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-200"}`}
                        >
                          <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate text-xs">{note.title}</span>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Settings Popover Menu */}
      {showSettingsMenu && (
        <div className="animate-in fade-in zoom-in-95 absolute bottom-16 left-3 z-50 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white text-xs font-medium text-slate-800 shadow-2xl duration-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          {/* Header */}
          <div className="space-y-0.5 border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-700/50 dark:bg-slate-800/80">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              User Account
            </p>
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
              {username}
            </p>
          </div>

          <div className="max-h-[60vh] space-y-0.5 overflow-y-auto py-2">
            {/* Thông tin cá nhân */}
            <div
              onClick={() => {
                alert("Tính năng Thông tin cá nhân đang được phát triển.");
                setShowSettingsMenu(false);
              }}
              className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60"
            >
              <User className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              <span>Thông tin cá nhân</span>
            </div>

            {/* Đổi mật khẩu */}
            <div
              onClick={() => {
                alert("Tính năng Đổi mật khẩu đang được phát triển.");
                setShowSettingsMenu(false);
              }}
              className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60"
            >
              <Lock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              <span>Đổi mật khẩu</span>
            </div>

            {/* Chế độ (Dark/Light toggle) */}
            <div className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-3">
                {theme === "dark" ?
                  <Moon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                : <Sun className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                }
                <span>Chế độ</span>
              </div>
              <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                <button
                  onClick={() => handleSetThemeMode("dark")}
                  className={`flex items-center gap-1 rounded-lg px-3 py-1 font-bold transition-all ${theme === "dark" ? "bg-sky-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}
                >
                  <Moon className="h-3 w-3" />
                  Dark
                </button>
                <button
                  onClick={() => handleSetThemeMode("light")}
                  className={`flex items-center gap-1 rounded-lg px-3 py-1 font-bold transition-all ${theme === "light" ? "bg-sky-500 text-white shadow-sm" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}
                >
                  <Sun className="h-3 w-3" />
                  Light
                </button>
              </div>
            </div>

            {/* Giao diện (Theme Picker Accordion) */}
            <div
              onClick={() => setShowThemePicker(!showThemePicker)}
              className="flex cursor-pointer items-center justify-between px-4 py-2.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60"
            >
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                <span>Giao diện</span>
              </div>
              {showThemePicker ?
                <ChevronDown className="h-4 w-4 text-slate-400" />
              : <ChevronRight className="h-4 w-4 text-slate-400" />}
            </div>

            {/* Expanded Theme Choices */}
            {showThemePicker && (
              <div className="grid grid-cols-2 gap-2.5 border-y border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800/50 dark:bg-slate-950/50">
                {themeOptions.map((opt) => {
                  const isActive = activeThemeColor === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectThemeColor(opt.id)}
                      className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-2.5 transition-all ${isActive ? "border-indigo-500 bg-white font-bold text-indigo-600 shadow-md shadow-indigo-500/10 dark:bg-slate-900 dark:text-indigo-400" : "border-slate-200 bg-white font-medium text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700"}`}
                    >
                      {isActive && (
                        <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 shadow-sm">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                      <div className="flex w-full items-center justify-center gap-1.5">
                        {opt.colors.map((c, i) => (
                          <div
                            key={i}
                            className={`h-4 w-5 rounded-md ${c} shadow-xs`}
                          />
                        ))}
                      </div>
                      <span className="w-full truncate text-center text-[11px]">
                        {opt.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Vocabulary Notes */}
            <div
              onClick={() => {
                alert("Vocabulary Notes: Bạn đang ở trong không gian ghi chú.");
                setShowSettingsMenu(false);
              }}
              className="flex cursor-pointer items-center justify-between px-4 py-2.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                <span>Vocabulary Notes</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>

            {/* Cài đặt AI Key */}
            {onOpenSettings && (
              <div
                onClick={() => {
                  onOpenSettings();
                  setShowSettingsMenu(false);
                }}
                className="flex cursor-pointer items-center justify-between px-4 py-2.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60"
              >
                <div className="flex items-center gap-3">
                  <Key className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <span>Cài đặt AI Key</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
            )}
          </div>

          {/* Đăng xuất */}
          <div
            onClick={handleLogout}
            className="flex cursor-pointer items-center gap-3 border-t border-slate-200 px-4 py-3.5 font-bold text-rose-500 transition-colors hover:bg-rose-50 dark:border-slate-800 dark:text-rose-400 dark:hover:bg-rose-950/20"
          >
            <LogOut className="h-4 w-4" />
            <span>Đăng xuất</span>
          </div>
        </div>
      )}

      {/* Footer User Status */}
      <div className="flex-shrink-0 space-y-2 border-t border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div
            className="group flex cursor-pointer items-center gap-2.5"
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-md shadow-indigo-600/20 transition-transform group-hover:scale-105">
              U
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                Learner
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Offline-first Mode
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onOpenTest && (
              <button
                onClick={onOpenTest}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-200 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                title="Start Quiz"
              >
                <GraduationCap className="h-4.5 w-4.5" />
              </button>
            )}
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className={`rounded-xl p-2 transition-colors ${showSettingsMenu ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "text-slate-400 hover:bg-slate-200 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400"}`}
              title="Settings Menu"
            >
              <Settings className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
