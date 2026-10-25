"use client";

import React, { useRef } from "react";

import { BookOpen, MessageSquare } from "lucide-react";

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
      stage: "translated", // Direct input mode so fields show immediately
      meaning: existing?.meaning || existing?.translation || "",
      translation: existing?.contexts?.[0]?.translation || "",
      ipa: existing?.ipa || "",
      pos: existing?.contexts?.[0]?.partOfSpeech || "",
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
            className="saved-word-wrap inline-flex items-center gap-1"
          >
            <span
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
                  ipa: matched.ipa || "",
                  pos: matched.contexts?.[0]?.partOfSpeech || "",
                });
              }}
            >
              {piece}
            </span>
            <button
              type="button"
              className="comment-badge inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[11px] font-medium text-[var(--muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--ink)]"
              title={`${matched.contexts?.length || 1} note(s)`}
              onClick={(e) => {
                e.stopPropagation();
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
                  ipa: matched.ipa || "",
                  pos: matched.contexts?.[0]?.partOfSpeech || "",
                });
              }}
            >
              <MessageSquare size={12} />
              <span>{matched.contexts?.length || 1}</span>
            </button>
          </span>
        );
      }
      return piece;
    });
  };

  const paragraphs = note.content ? note.content.split("\n\n") : [];

  return (
    <div className="note-content">
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

      <div className="note-bottom">
        <span>{wordCount} words</span>
      </div>
    </div>
  );
}
