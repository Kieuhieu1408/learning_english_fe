"use client";

import React, { useEffect, useState } from "react";

import { Plus } from "lucide-react";

import type { PopoverSelection } from "~/components/popovers/WordPopover";
import type { NoteOffline } from "~/lib/db";
import type { WordWithContexts } from "~/services/words";

import { Button } from "~/components/ui";

import { MarginRail } from "./MarginRail";
import { NoteEditor } from "./NoteEditor";
import { NoteReader } from "./NoteReader";
import { NoteToolbar } from "./NoteToolbar";

export function NotesWorkspace({
  note,
  savedWords,
  onSaveNote,
  onManageNote,
  onCreateNewNote,
  onOpenSelection,
  onNavigateVocab,
  onSelectWord,
}: {
  note: NoteOffline | null;
  savedWords: WordWithContexts[];
  onSaveNote: (updated: { title: string; content: string }) => Promise<void>;
  onManageNote: () => void;
  onCreateNewNote: () => void;
  onOpenSelection: (selection: PopoverSelection) => void;
  onNavigateVocab: () => void;
  onSelectWord?: (wordId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(note?.title || "");
  const [draftContent, setDraftContent] = useState(note?.content || "");

  useEffect(() => {
    if (note) {
      setDraftTitle(note.title);
      setDraftContent(note.content);
      setEditing(false);
    }
  }, [note?.id]);

  const hasUnsavedChanges =
    editing &&
    (draftTitle !== (note?.title || "") ||
      draftContent !== (note?.content || ""));

  const handleToggleEdit = async () => {
    if (editing) {
      await onSaveNote({
        title: draftTitle.trim() || "Untitled Note",
        content: draftContent,
      });
      setEditing(false);
    } else {
      if (!note) return;
      setDraftTitle(note.title);
      setDraftContent(note.content);
      setEditing(true);
    }
  };

  const handleCancelEdit = () => {
    if (!note) return;
    setDraftTitle(note.title);
    setDraftContent(note.content);
    setEditing(false);
  };

  if (!note) {
    return (
      <div className="notes-workspace empty-workspace flex flex-col items-center justify-center p-12 text-center">
        <p className="mb-4 text-lg text-[var(--muted)]">No note selected.</p>
        <Button className="primary" onClick={onCreateNewNote}>
          <Plus size={16} /> Create your first note
        </Button>
      </div>
    );
  }

  const noteWords = savedWords.filter((w) =>
    w.contexts.some((c) => c.noteId === note.id),
  );

  return (
    <div className="notes-workspace">
      <NoteToolbar
        editing={editing}
        hasUnsavedChanges={hasUnsavedChanges}
        onToggleEdit={handleToggleEdit}
        onCancelEdit={handleCancelEdit}
        onManageNote={onManageNote}
      />

      {editing ?
        <NoteEditor
          title={draftTitle}
          content={draftContent}
          onChangeTitle={setDraftTitle}
          onChangeContent={setDraftContent}
        />
      : <NoteReader
          note={note}
          savedWords={savedWords}
          onOpenSelection={onOpenSelection}
        />
      }

      <MarginRail
        noteWords={noteWords}
        onNavigateVocab={onNavigateVocab}
        onSelectWord={onSelectWord}
      />
    </div>
  );
}
