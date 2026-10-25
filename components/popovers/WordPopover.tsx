"use client";

import React from "react";

import { Check, Plus, Sparkles, Volume2, X } from "lucide-react";

import type { PopoverSelection } from "~/types";

import { Button, Heading, Input } from "~/components/ui";
import { translateContextApi } from "~/services/ai";

export type { PopoverSelection };

export function WordPopover({
  selection,
  setSelection,
  onClose,
  existingWord,
  onSaveWord,
}: {
  selection: PopoverSelection;
  setSelection: React.Dispatch<React.SetStateAction<PopoverSelection | null>>;
  onClose: () => void;
  existingWord?: {
    id: string;
    text: string;
    meaning: string;
    contextsCount: number;
  } | null;
  onSaveWord: (data: {
    text: string;
    sentence: string;
    meaning: string;
    translation: string;
    ipa?: string;
    pos?: string;
  }) => Promise<void>;
}) {
  const speak = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  const [ipa, setIpa] = React.useState(selection.ipa || "");
  const [pos, setPos] = React.useState(selection.pos || "word");
  const [isTranslating, setIsTranslating] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [aiError, setAiError] = React.useState<string | null>(null);

  const handleExploreMeaning = async () => {
    setIsTranslating(true);
    setAiError(null);
    try {
      const result = await translateContextApi({
        text: selection.text,
        sentence: selection.sentence,
      });

      if (result.ipa) setIpa(result.ipa);
      if (result.partOfSpeech) setPos(result.partOfSpeech);

      setSelection((prev) =>
        prev ?
          {
            ...prev,
            stage: "translated",
            meaning: result.meaning || prev.meaning,
            translation: result.sentenceTranslation || prev.translation || "",
            ipa: result.ipa || prev.ipa,
            pos: result.partOfSpeech || prev.pos,
          }
        : null,
      );
    } catch (err: any) {
      console.error("translateContextApi failed:", err);
      setAiError(
        err.message ||
          "AI translation unavailable. You can enter the meaning manually below.",
      );
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSave = async () => {
    if (!selection.meaning.trim() || isSaving) return;
    setIsSaving(true);
    try {
      await onSaveWord({
        text: selection.text,
        sentence: selection.sentence,
        meaning: selection.meaning.trim(),
        translation: selection.translation.trim(),
        ipa,
        pos,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="selection-dismiss" onClick={onClose} />
      <div
        className="word-popover border border-[var(--border)] bg-[var(--surface)] shadow-xl"
        style={{ left: `${selection.x}px`, top: `${selection.y}px` }}
        role="dialog"
        aria-label={`Definition for ${selection.text}`}
      >
        <div className="popover-heading flex items-center justify-between pb-2">
          <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
            <span className="font-medium text-[var(--ink)]">
              Vocabulary Note
            </span>
            <span>·</span>
            <span>{existingWord ? "In vocabulary" : "New entry"}</span>
          </div>
          <Button
            className="icon-button"
            aria-label="Close word preview"
            onClick={onClose}
          >
            <X size={15} />
          </Button>
        </div>

        <div className="my-1 border-l-2 border-yellow-400 pl-2.5">
          <div className="selected-title flex items-center justify-between">
            <Heading
              level={2}
              className="text-base font-semibold text-[var(--ink)]"
            >
              {selection.text}
            </Heading>
            <Button
              className="icon-button"
              aria-label="Listen to word"
              title="Pronounce"
              onClick={() => speak(selection.text)}
            >
              <Volume2 size={16} />
            </Button>
          </div>

          {(ipa || pos) && (
            <div className="mt-0.5 text-[11px] text-[var(--muted)]">
              {ipa}{" "}
              {pos && (
                <span className="py-0.2 ml-1 rounded bg-[var(--hover)] px-1 text-[10px]">
                  {pos}
                </span>
              )}
            </div>
          )}

          {selection.sentence && (
            <p className="selection-context mt-1 line-clamp-2 text-xs text-[var(--secondary)] italic">
              “{selection.sentence}”
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 pb-1">
          <span className="text-[11px] font-semibold tracking-wider text-[var(--muted)] uppercase">
            Definition & Translation
          </span>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs text-[var(--iris)] hover:underline disabled:opacity-50"
            onClick={handleExploreMeaning}
            disabled={isTranslating}
          >
            <Sparkles
              size={13}
              className={isTranslating ? "animate-spin" : ""}
            />
            <span>
              {isTranslating ? "Translating..." : "Auto-fill with AI"}
            </span>
          </button>
        </div>

        {aiError && (
          <div className="my-1 rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
            {aiError}
          </div>
        )}

        {existingWord && (
          <div className="existing-word my-1 flex items-center gap-1.5 rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Check size={13} />
            Already saved · {existingWord.contextsCount} context(s)
          </div>
        )}

        <div className="mt-1 space-y-2">
          <label className="block text-xs font-medium text-[var(--muted)]">
            Vietnamese meaning
            <Input
              autoFocus
              className="mt-1 w-full"
              value={selection.meaning}
              placeholder="e.g. mang tính hệ thống"
              onChange={(e) =>
                setSelection((prev) =>
                  prev ? { ...prev, meaning: e.target.value } : null,
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && selection.meaning.trim()) {
                  handleSave();
                }
              }}
            />
          </label>

          <label className="block text-xs font-medium text-[var(--muted)]">
            Context translation / Example note
            <Input
              className="mt-1 w-full"
              value={selection.translation}
              placeholder="Add sentence translation or example note (optional)"
              onChange={(e) =>
                setSelection((prev) =>
                  prev ? { ...prev, translation: e.target.value } : null,
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && selection.meaning.trim()) {
                  handleSave();
                }
              }}
            />
          </label>
        </div>

        <Button
          className="primary full mt-3"
          disabled={!selection.meaning.trim() || isSaving}
          onClick={handleSave}
        >
          <Plus size={15} />
          {isSaving ?
            "Saving..."
          : existingWord ?
            "Add this context"
          : "Save to vocabulary"}
        </Button>
      </div>
    </>
  );
}
