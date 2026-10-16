"use client";

import React from "react";

import {
  ChevronRight,
  Cloud,
  CloudOff,
  Flame,
  Menu,
  Moon,
  RefreshCw,
  Sun,
} from "lucide-react";

import type { NavView, SyncStatus } from "~/types";

import { Button } from "~/components/ui";

export function Topbar({
  currentView,
  topicName,
  noteTitle,
  mobileOpen,
  setMobileOpen,
  streakDays = 0,
  syncStatus = "synced",
  onTriggerSync,
  dark,
  onToggleDark,
}: {
  currentView: NavView;
  topicName?: string;
  noteTitle?: string;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  streakDays?: number;
  syncStatus?: "synced" | "offline" | "syncing" | "pending";
  onTriggerSync?: () => void;
  dark: boolean;
  onToggleDark: () => void;
}) {
  return (
    <header className="topbar">
      <Button
        className="icon-button mobile-menu"
        aria-label="Toggle sidebar"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Menu size={19} />
      </Button>

      <div className="breadcrumb">
        {currentView === "Notes" ?
          <>
            <span>Notes</span>
            <ChevronRight size={13} />
            <span>{topicName || "General"}</span>
            {noteTitle && (
              <>
                <ChevronRight size={13} />
                <span className="max-w-[200px] truncate font-semibold text-[var(--ink)]">
                  {noteTitle}
                </span>
              </>
            )}
          </>
        : <span>{currentView}</span>}
      </div>

      <div className="header-right">
        <span className="streak" title="Consistent practice builds vocabulary">
          <Flame size={15} /> <b>{streakDays}</b> day streak
        </span>

        <span className="header-divider" />

        <Button
          className="sync-button"
          aria-label="Cloud sync status"
          onClick={onTriggerSync}
          title={
            syncStatus === "syncing" ? "Syncing in progress..."
            : syncStatus === "offline" ?
              "Offline mode - changes saved locally"
            : "Synchronized with server"
          }
        >
          {syncStatus === "syncing" ?
            <RefreshCw size={15} className="animate-spin text-[var(--iris)]" />
          : syncStatus === "offline" ?
            <CloudOff size={15} className="text-[var(--muted)]" />
          : <Cloud size={15} className="text-[var(--sage)]" />}
          <span>
            {syncStatus === "syncing" ?
              "Syncing"
            : syncStatus === "offline" ?
              "Offline"
            : "Synced"}
          </span>
        </Button>

        <Button
          className="icon-button"
          aria-label="Toggle theme"
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
          onClick={onToggleDark}
        >
          {dark ?
            <Sun size={17} />
          : <Moon size={17} />}
        </Button>
      </div>
    </header>
  );
}
