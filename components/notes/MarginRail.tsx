"use client";

import React from "react";

import { ArrowUpRight, BookOpen, Volume2 } from "lucide-react";

import type { CSSProperties } from "react";

import type { WordWithContexts } from "~/types";

import { Button } from "~/components/ui";

export function MarginRail({
  railRef,
  orderedWords,
  positions,
  selectedWordId,
  railHeight,
  onSelectWord,
  onNavigateVocab,
  onSpeak,
}: {
  railRef: React.RefObject<HTMLElement | null>;
  orderedWords: WordWithContexts[];
  positions: { id: string; top: number; height: number }[];
  selectedWordId: string | null;
  railHeight: number;
  onSelectWord: (wordId: string) => void;
  onNavigateVocab: () => void;
  onSpeak: (text: string) => void;
}) {
  if (!orderedWords.length) return null;

  return (
    <aside
      ref={railRef as any}
      className="word-notes word-notes-inline"
      aria-label="Vocabulary in this note"
      style={{ "--word-notes-height": `${railHeight}px` } as CSSProperties}
    >
      {orderedWords.map((word) => {
        const isSelected = selectedWordId === word.id;
        const position = positions.find((item) => item.id === word.id);
        const meaning = word.meaning || word.translation || "";
        const pos =
          word.partOfSpeech ||
          word.pos ||
          word.contexts?.[0]?.partOfSpeech ||
          "";

        return (
          <div
            key={word.id}
            data-note-id={word.id}
            className={`word-note ${isSelected ? "word-note-selected" : ""}`}
            style={
              {
                "--annotation-top": `${position?.top || 0}px`,
                visibility:
                  !position && positions.length ? "hidden" : undefined,
              } as CSSProperties
            }
          >
            <button
              type="button"
              className="word-note-summary"
              aria-expanded={isSelected}
              onClick={() => onSelectWord(word.id)}
            >
              <div className="word-note-summary-header">
                <strong className="word-note-text">{word.text}</strong>
                {word.ipa && <span className="word-note-ipa">{word.ipa}</span>}
              </div>
              <span className="word-note-meaning">{meaning}</span>
            </button>

            {isSelected && (
              <div className="word-note-detail">
                <div className="word-note-pronunciation">
                  <span>{pos || "word"}</span>
                  <Button
                    className="icon-button"
                    aria-label={`Listen to ${word.text}`}
                    title="Pronounce"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSpeak(word.text);
                    }}
                  >
                    <Volume2 size={13} />
                  </Button>
                </div>
                <div className="word-note-actions">
                  <Button
                    className="quiet"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateVocab();
                    }}
                  >
                    <BookOpen size={12} />
                    Vocabulary
                    <ArrowUpRight size={11} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
}
