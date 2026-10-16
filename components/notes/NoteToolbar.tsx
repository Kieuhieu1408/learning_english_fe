"use client";

import React from "react";

import { Check, MoreHorizontal, Pencil, X } from "lucide-react";

import { Button } from "~/components/ui";

export function NoteToolbar({
  editing,
  hasUnsavedChanges,
  onToggleEdit,
  onCancelEdit,
  onManageNote,
}: {
  editing: boolean;
  hasUnsavedChanges: boolean;
  onToggleEdit: () => void;
  onCancelEdit?: () => void;
  onManageNote: () => void;
}) {
  return (
    <div className="note-toolbar">
      <div>
        <span
          className={`tiny-dot ${hasUnsavedChanges ? "bg-[#d97706]" : ""}`}
        />
        <span>
          {hasUnsavedChanges ? "Unsaved changes" : "All changes saved"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {editing && onCancelEdit && (
          <Button className="quiet text-[var(--muted)]" onClick={onCancelEdit}>
            <X size={14} /> Cancel
          </Button>
        )}

        <Button className="quiet" onClick={onToggleEdit}>
          {editing ?
            <Check size={14} />
          : <Pencil size={14} />}{" "}
          {editing ? "Save note" : "Edit note"}
        </Button>

        <Button
          className="icon-button"
          aria-label="Note options"
          onClick={onManageNote}
        >
          <MoreHorizontal size={19} />
        </Button>
      </div>
    </div>
  );
}
