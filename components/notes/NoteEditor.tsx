"use client";

import React, { useRef } from "react";

import type { PopoverSelection, WordWithContexts } from "~/types";

import { Input } from "~/components/ui";
import { normalize } from "~/lib/demoData";

export function NoteEditor({
  title,
  content,
  onChangeTitle,
  onChangeContent,
  onOpenSelection,
  savedWords = [],
}: {
  title: string;
  content: string;
  onChangeTitle: (title: string) => void;
  onChangeContent: (content: string) => void;
  onOpenSelection?: (selection: PopoverSelection) => void;
  savedWords?: WordWithContexts[];
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 200, y: 200 });

  const handleSelectText = (
    e?:
      | React.MouseEvent<HTMLTextAreaElement>
      | React.KeyboardEvent<HTMLTextAreaElement>
      | React.SyntheticEvent<HTMLTextAreaElement>,
  ) => {
    const textarea = textareaRef.current;
    if (!textarea || !onOpenSelection) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === end) return;

    const selected = textarea.value.substring(start, end).trim();
    if (!selected || selected.length > 80) return;

    const norm = normalize(selected);
    if (!norm) return;

    // Sentence context extraction
    const fullText = textarea.value;
    const sentenceStart =
      Math.max(
        fullText.lastIndexOf(".", start - 1),
        fullText.lastIndexOf("!", start - 1),
        fullText.lastIndexOf("?", start - 1),
        fullText.lastIndexOf("\n", start - 1),
      ) + 1;

    const sentenceEnd = fullText.slice(end).search(/[.!?\n]/);
    const sentence = fullText
      .slice(
        sentenceStart,
        sentenceEnd < 0 ? fullText.length : end + sentenceEnd + 1,
      )
      .trim();

    // Coordinates calculation
    let x = mousePosRef.current.x;
    let y = mousePosRef.current.y;
    if (e && "clientX" in e && (e as React.MouseEvent).clientX > 0) {
      x = (e as React.MouseEvent).clientX;
      y = (e as React.MouseEvent).clientY;
    } else {
      const rect = textarea.getBoundingClientRect();
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        x = rect.left + 80;
        y = rect.top + 100;
      }
    }

    const popX = Math.max(16, Math.min(x, window.innerWidth - 380));
    const popY = y + 420 > window.innerHeight ? Math.max(70, y - 390) : y + 12;

    const existing = savedWords?.find((w) => normalize(w.text) === norm);

    onOpenSelection({
      text: norm,
      sentence: sentence || selected,
      x: popX,
      y: popY,
      stage: "translated", // Direct input mode so fields appear immediately
      meaning: existing?.meaning || existing?.translation || "",
      translation: existing?.contexts?.[0]?.translation || "",
      ipa: existing?.ipa || "",
      pos: existing?.contexts?.[0]?.partOfSpeech || "",
    });
  };

  return (
    <div className="note-content">
      <Input
        aria-label="Note title"
        className="title-input"
        placeholder="Untitled Note"
        value={title}
        onChange={(e) => onChangeTitle(e.target.value)}
      />

      <textarea
        ref={textareaRef}
        className="editor"
        aria-label="Note content"
        placeholder="Start writing or paste an article here..."
        value={content}
        onChange={(e) => onChangeContent(e.target.value)}
        onMouseDown={(e) => {
          mousePosRef.current = { x: e.clientX, y: e.clientY };
        }}
        onMouseMove={(e) => {
          if (e.buttons === 1) {
            mousePosRef.current = { x: e.clientX, y: e.clientY };
          }
        }}
        onMouseUp={handleSelectText}
        onKeyUp={handleSelectText}
        onSelect={handleSelectText}
      />

      <div className="note-bottom">
        <span>{content ? content.trim().split(/\s+/).length : 0} words</span>
      </div>
    </div>
  );
}
