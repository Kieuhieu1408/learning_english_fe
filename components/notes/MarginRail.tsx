"use client";

import React from "react";

import { ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";

import type { WordWithContexts } from "~/types";

import { Button } from "~/components/ui";

export function MarginRail({
  noteWords,
  onNavigateVocab,
  onSelectWord,
}: {
  noteWords: WordWithContexts[];
  onNavigateVocab: () => void;
  onSelectWord?: (wordId: string) => void;
}) {
  return (
    <aside className="margin-rail">
      <div className="rail-label">
        <BookOpen size={15} /> IN THIS NOTE <span>{noteWords.length}</span>
      </div>
      <p>
        Little discoveries,
        <br />
        worth keeping.
      </p>

      {noteWords.slice(0, 5).map((w) => (
        <Button
          className="margin-word"
          key={w.id}
          onClick={() => {
            if (onSelectWord) onSelectWord(w.id);
            onNavigateVocab();
          }}
        >
          <span>
            {w.text}
            <ArrowUpRight size={12} />
          </span>
          <small>{(w.meaning || w.translation || "").split(",")[0]}</small>
        </Button>
      ))}

      <Button className="all-words" onClick={onNavigateVocab}>
        View vocabulary <ArrowRight size={13} />
      </Button>

      <div className="rail-quote">
        “Attention is the beginning
        <br />
        of devotion.”
        <small>— Mary Oliver</small>
      </div>
    </aside>
  );
}
