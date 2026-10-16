"use client";

import React, { useRef } from "react";

import { BookOpen, Leaf, Sparkles } from "lucide-react";

import type { NoteOffline, PopoverSelection, WordWithContexts } from "~/types";

import { Heading } from "~/components/ui";
import { normalize } from "~/lib/demoData";

export function NoteReader({
  note,
  savedWords,
  onOpenSelection,
}: {
  note: NoteOffline;
  savedWords: WordWithContexts[];
  onOpenSelection: (selection: PopoverSelection) => void;
}) {
  const articleRef = useRef<HTMLElement>(null);

  const wordCount = note.content ? note.content.trim().split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 180));

  const noteWordsCount = savedWords.filter((w) =>
    w.contexts.some((c) => c.noteId === note.id),
  ).length;

  const handleSelectText = () => {
    const s = window.getSelection();
    if (
      !s ||
      s.isCollapsed ||
      !articleRef.current?.contains(s.anchorNode) ||
      !articleRef.current.contains(s.focusNode)
    ) {
      return;
    }

    const text = s.toString().trim();
    if (!text || text.length > 80) return;

    const range = s.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    const before = range.cloneRange();
    before.selectNodeContents(articleRef.current);
    before.setEnd(range.startContainer, range.startOffset);
    const offset = before.toString().length;
    const content = articleRef.current.textContent || "";

    const start =
      Math.max(
        content.lastIndexOf(".", offset - 1),
        content.lastIndexOf("!", offset - 1),
        content.lastIndexOf("?", offset - 1),
      ) + 1;
    const end = content.slice(offset + text.length).search(/[.!?]/);
    const sentence = content
      .slice(start, end < 0 ? content.length : offset + text.length + end + 1)
      .trim();

    const norm = normalize(text);
    const existing = savedWords.find((w) => normalize(w.text) === norm);

    onOpenSelection({
      text: norm,
      sentence: sentence || text,
      x: Math.max(16, Math.min(rect.left, window.innerWidth - 354)),
      y:
        rect.bottom + 420 > window.innerHeight ?
          Math.max(70, rect.top - 390)
        : rect.bottom + 12,
      stage: existing ? "translated" : "preview",
      meaning: existing?.meaning || existing?.translation || "",
      translation: existing?.contexts?.[0]?.translation || "",
    });
  };

  const renderText = (paragraph: string) => {
    return paragraph.split(/(\b[\w'-]+\b)/g).map((piece, i) => {
      const norm = normalize(piece);
      const matched = savedWords.find((w) => normalize(w.text) === norm);

      if (matched) {
        return (
          <span
            key={i}
            className="saved-word"
            title={matched.meaning || matched.translation}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const sent =
                note.content
                  .split(/(?<=[.!?])\s+/)
                  .find((s) => s.toLowerCase().includes(norm)) || piece;

              onOpenSelection({
                text: matched.text,
                sentence: sent,
                x: Math.max(16, Math.min(r.left, window.innerWidth - 354)),
                y: Math.min(r.bottom + 10, window.innerHeight - 400),
                stage: "translated",
                meaning: matched.meaning || matched.translation,
                translation: matched.contexts?.[0]?.translation || "",
              });
            }}
          >
            {piece}
          </span>
        );
      }
      return piece;
    });
  };

  const paragraphs = note.content ? note.content.split("\n\n") : [];

  return (
    <div className="note-content">
      <div className="eyebrow">
        <span className="tiny-square" /> PERSONAL NOTE{" "}
        <span className="eyebrow-line" /> 01
      </div>

      <Heading>{note.title}</Heading>

      <div className="note-meta">
        <span>
          {note.updatedAtMs ?
            new Date(note.updatedAtMs).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })
          : ""}
        </span>
        <span>·</span>
        <span>{readTime} min read</span>
        <span>·</span>
        <span className="iris">
          <BookOpen size={13} />
          {noteWordsCount} words collected
        </span>
      </div>

      <div className="reading-tip">
        <div className="tip-icon">
          <Sparkles size={16} />
        </div>
        <p>
          A word catches your eye?{" "}
          <strong>Select it to explore its meaning</strong> and make it yours.
        </p>
        <span className="tip-key">Try it</span>
      </div>

      <article
        ref={articleRef}
        className="article"
        onMouseUp={handleSelectText}
        onKeyUp={handleSelectText}
        tabIndex={0}
      >
        {paragraphs.map((p, i) => (
          <p key={i}>{renderText(p)}</p>
        ))}
      </article>

      <div className="article-end">
        <span />
        <Leaf size={17} />
        <span />
      </div>

      <div className="note-bottom">
        <span>{wordCount} words</span>
        <span>A space to read, notice, and grow.</span>
      </div>
    </div>
  );
}
