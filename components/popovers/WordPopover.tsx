"use client";

import React from "react";

import { Check, Plus, Sparkles, Volume2, X } from "lucide-react";

import type { PopoverSelection } from "~/types";

import { Button, Heading, Input } from "~/components/ui";
import { dictionary } from "~/lib/demoData";

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

  const dictEntry = dictionary.find(
    (e) => e[0].toLowerCase() === selection.text.toLowerCase(),
  );
  const ipa = dictEntry?.[1] || "";
  const pos = dictEntry?.[2] || "word";

  const handleExploreMeaning = () => {
    setSelection((prev) => (prev ? { ...prev, stage: "loading" } : null));

    setTimeout(() => {
      const meaning =
        dictEntry?.[3] || selection.meaning || "Từ vựng tiếng Anh";
      const translation = dictEntry ? "Bản dịch mẫu ngữ cảnh tiếng Việt." : "";

      setSelection((prev) =>
        prev ?
          {
            ...prev,
            stage: "translated",
            meaning,
            translation: prev.translation || translation,
          }
        : null,
      );
    }, 450);
  };

  const handleSave = async () => {
    if (!selection.meaning.trim()) return;
    await onSaveWord({
      text: selection.text,
      sentence: selection.sentence,
      meaning: selection.meaning.trim(),
      translation: selection.translation.trim(),
      ipa,
      pos,
    });
    onClose();
  };

  return (
    <>
      <div className="selection-dismiss" onClick={onClose} />
      <div
        className="word-popover"
        style={{ left: `${selection.x}px`, top: `${selection.y}px` }}
        role="dialog"
        aria-label={`Definition for ${selection.text}`}
      >
        <div className="popover-heading">
          <span>
            <Sparkles size={14} /> A LITTLE DISCOVERY
          </span>
          <Button
            className="icon-button"
            aria-label="Close word preview"
            onClick={onClose}
          >
            <X size={15} />
          </Button>
        </div>

        <div className="selected-title">
          <Heading level={2}>{selection.text}</Heading>
          <Button
            className="icon-button"
            aria-label="Listen to word"
            title="Pronounce"
            onClick={() => speak(selection.text)}
          >
            <Volume2 size={18} />
          </Button>
        </div>

        {selection.stage === "preview" && (
          <>
            <p className="selection-context">“{selection.sentence}”</p>
            <Button className="primary full" onClick={handleExploreMeaning}>
              <Sparkles size={15} />
              Explore meaning
            </Button>
          </>
        )}

        {selection.stage === "loading" && (
          <p className="loading py-4 text-center text-[var(--muted)]">
            Finding the right words…
          </p>
        )}

        {selection.stage === "error" && (
          <div className="space-y-2 py-2">
            <p className="text-sm text-[var(--muted)]">
              Translation unavailable.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleExploreMeaning}>Retry</Button>
              <Button
                onClick={() =>
                  setSelection((prev) =>
                    prev ? { ...prev, stage: "translated" } : null,
                  )
                }
              >
                Enter manually
              </Button>
            </div>
          </div>
        )}

        {selection.stage === "translated" && (
          <>
            <div className="word-definition">
              {ipa} {pos && <span>{pos}</span>}
            </div>

            {existingWord && (
              <div className="existing-word">
                <Check size={13} />
                Already in your vocabulary · {existingWord.contextsCount}{" "}
                context(s)
              </div>
            )}

            <label>
              Vietnamese meaning
              <Input
                value={selection.meaning}
                placeholder="Enter a meaning"
                onChange={(e) =>
                  setSelection((prev) =>
                    prev ? { ...prev, meaning: e.target.value } : null,
                  )
                }
              />
            </label>

            <p className="selection-context">“{selection.sentence}”</p>

            <label>
              Context translation
              <Input
                value={selection.translation}
                placeholder="Add sentence translation (optional)"
                onChange={(e) =>
                  setSelection((prev) =>
                    prev ? { ...prev, translation: e.target.value } : null,
                  )
                }
              />
            </label>

            <Button
              className="primary full"
              disabled={!selection.meaning.trim()}
              onClick={handleSave}
            >
              <Plus size={15} />
              {existingWord ? "Add this context" : "Save to vocabulary"}
            </Button>
          </>
        )}

        <small className="sample-label">
          Editorial dictionary & AI assistance
        </small>
      </div>
    </>
  );
}
