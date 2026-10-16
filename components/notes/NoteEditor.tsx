"use client";

import React from "react";

import { Input } from "~/components/ui";

export function NoteEditor({
  title,
  content,
  onChangeTitle,
  onChangeContent,
}: {
  title: string;
  content: string;
  onChangeTitle: (title: string) => void;
  onChangeContent: (content: string) => void;
}) {
  return (
    <div className="note-content">
      <div className="eyebrow">
        <span className="tiny-square" /> EDITING NOTE{" "}
        <span className="eyebrow-line" />
      </div>

      <Input
        aria-label="Note title"
        className="title-input"
        placeholder="Untitled Note"
        value={title}
        onChange={(e) => onChangeTitle(e.target.value)}
      />

      <textarea
        className="editor"
        aria-label="Note content"
        placeholder="Start writing or paste an article here..."
        value={content}
        onChange={(e) => onChangeContent(e.target.value)}
      />

      <div className="note-bottom">
        <span>{content ? content.trim().split(/\s+/).length : 0} words</span>
        <span>Changes saved automatically or by clicking Save.</span>
      </div>
    </div>
  );
}
