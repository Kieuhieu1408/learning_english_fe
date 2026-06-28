"use client";

import React from "react";

import { useLiveQuery } from "dexie-react-hooks";
import {
  Award,
  Calendar,
  Cloud,
  CloudOff,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { db } from "../lib/db";

interface DashboardCountersProps {
  currentTab: "editor" | "quiz";
  onTabChange: (tab: "editor" | "quiz") => void;
  syncStatus: string;
  onSync: () => void;
}

export default function DashboardCounters({
  currentTab,
  onTabChange,
  syncStatus,
  onSync,
}: DashboardCountersProps) {
  // Real-time live queries on metadata cache
  const dailyCount =
    useLiveQuery(() =>
      db.syncMetadata.get("dailyWordCount").then((res) => res?.value || "0"),
    ) || "0";
  const totalCount =
    useLiveQuery(() =>
      db.syncMetadata.get("totalWordCount").then((res) => res?.value || "0"),
    ) || "0";

  const isOnline = syncStatus !== "offline";

  return (
    <header className="z-20 flex w-full flex-col items-center justify-between border-b border-slate-200 bg-white select-none md:flex-row dark:border-slate-800 dark:bg-slate-900">
      {/* Left section: App Brand & Sync button (aligned with w-64 sidebar) */}
      <div className="flex w-full flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:w-64 md:border-r md:border-b-0 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <h1 className="truncate text-base font-bold tracking-wide text-slate-900 dark:text-white">
            English Notes
          </h1>
        </div>
        <button
          onClick={onSync}
          className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          title="Synchronize offline data"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${syncStatus === "syncing" ? "animate-spin text-indigo-600 dark:text-indigo-400" : ""}`}
          />
          Sync
        </button>
      </div>

      {/* Center section: Tab Selectors */}
      <div className="flex flex-1 items-center justify-center gap-1 px-4 py-2 md:justify-start md:py-0">
        <button
          onClick={() => onTabChange("editor")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${currentTab === "editor" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}
        >
          <Sparkles className="h-4 w-4" />
          Word Editor
        </button>
        <button
          onClick={() => onTabChange("quiz")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${currentTab === "quiz" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}
        >
          <Calendar className="h-4 w-4" />
          Review Session
        </button>
      </div>

      {/* Right section: Stats and Server Sync Status */}
      <div className="flex flex-shrink-0 items-center gap-4 px-6 py-2 md:py-0">
        {/* Daily Stats Pill */}
        <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200/60 bg-slate-100 px-3.5 py-1.5 shadow-sm dark:border-slate-700/50 dark:bg-slate-800/60">
          <div className="rounded-lg bg-indigo-500/10 p-1.5 text-indigo-600 dark:text-indigo-400">
            <Award className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-[9px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
              Today's Streak
            </p>
            <p className="text-xs font-extrabold text-slate-900 dark:text-white">
              {dailyCount} words
            </p>
          </div>
        </div>

        {/* Total Stats Pill */}
        <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200/60 bg-slate-100 px-3.5 py-1.5 shadow-sm dark:border-slate-700/50 dark:bg-slate-800/60">
          <div className="rounded-lg bg-amber-500/10 p-1.5 text-amber-600 dark:text-amber-400">
            <Award className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-[9px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
              Total Words
            </p>
            <p className="text-xs font-extrabold text-slate-900 dark:text-white">
              {totalCount} cards
            </p>
          </div>
        </div>

        {/* Server Sync Status Indicator */}
        <div className="flex items-center gap-2">
          {isOnline ?
            <div className="flex items-center gap-1.5 rounded-2xl border border-emerald-200 bg-emerald-100 px-3.5 py-2 text-xs font-semibold text-emerald-700 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Cloud className="h-3.5 w-3.5" />
              Connected
            </div>
          : <div className="flex items-center gap-1.5 rounded-2xl border border-amber-200 bg-amber-100 px-3.5 py-2 text-xs font-semibold text-amber-700 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
              <CloudOff className="h-3.5 w-3.5" />
              Offline
            </div>
          }
        </div>
      </div>
    </header>
  );
}
