"use client";

import React from "react";

import { BookOpen, Keyboard, Settings2 } from "lucide-react";

import { Modal } from "~/components/ui";

export function HelpModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <Modal title="Make yourself at home." close={onClose}>
      <div className="help-list space-y-4">
        <div className="flex items-start gap-3">
          <BookOpen size={18} className="mt-0.5 shrink-0 text-[var(--iris)]" />
          <span className="text-sm">
            Select any word or short phrase in a note to explore its meaning and
            save it to your vocabulary. Words you have saved appear with an
            elegant dotted underline.
          </span>
        </div>

        <div className="flex items-start gap-3">
          <Keyboard size={18} className="mt-0.5 shrink-0 text-[var(--iris)]" />
          <span className="text-sm">
            During flashcard practice, press{" "}
            <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 font-mono text-xs">
              Space
            </kbd>{" "}
            to flip the card,{" "}
            <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 font-mono text-xs">
              1
            </kbd>{" "}
            for Still learning, or{" "}
            <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 font-mono text-xs">
              2
            </kbd>{" "}
            for Remembered. Press{" "}
            <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 font-mono text-xs">
              R
            </kbd>{" "}
            to hear the word, or{" "}
            <kbd className="rounded border border-[var(--border)] px-1.5 py-0.5 font-mono text-xs">
              S
            </kbd>{" "}
            to listen to the sample sentence.
          </span>
        </div>

        <div className="flex items-start gap-3">
          <Settings2 size={18} className="mt-0.5 shrink-0 text-[var(--iris)]" />
          <span className="text-sm">
            Open your profile menu in the bottom left of the sidebar for AI
            Settings, Dark Mode, and Cloud Sync.
          </span>
        </div>

        <div className="notice rounded border border-[var(--border)] bg-[var(--subtle)] p-3 text-xs text-[var(--muted)]">
          <strong>Offline-First:</strong> All notes and words are saved directly
          to your local database (IndexedDB) and sync automatically when online.
        </div>
      </div>
    </Modal>
  );
}
