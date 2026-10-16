"use client";

import React from "react";

import type { ConflictNote } from "~/types";

import { Button, Heading, Modal } from "~/components/ui";

export type { ConflictNote };

export function SyncConflictModal({
  isOpen,
  localNote,
  cloudNote,
  onClose,
  onResolve,
}: {
  isOpen: boolean;
  localNote: ConflictNote;
  cloudNote: ConflictNote;
  onClose: () => void;
  onResolve: (choice: "local" | "cloud") => void;
}) {
  if (!isOpen) return null;

  const formatDate = (ms?: number) => {
    if (!ms) return "Recently";
    return new Date(ms).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Modal title="Let’s bring your notes together." close={onClose} wide={true}>
      <p className="modal-description mb-4 text-sm text-[var(--muted)]">
        This note was updated both on this device and on the cloud. Choose which
        version you’d like to keep.
      </p>

      <div className="conflict-grid grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Local device column */}
        <div className="conflict-card rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-[var(--muted)] uppercase">
              This Device
            </span>
            <small className="text-xs text-[var(--muted)]">
              {formatDate(localNote.updatedAtMs)}
            </small>
          </div>
          <Heading level={3} className="mb-1 text-base font-medium">
            {localNote.title}
          </Heading>
          <p className="mb-4 max-h-48 overflow-y-auto rounded bg-[var(--subtle)] p-2 text-xs whitespace-pre-wrap text-[var(--muted)]">
            {localNote.content.slice(0, 300)}
            {localNote.content.length > 300 ? "…" : ""}
          </p>
          <Button
            className="primary full"
            onClick={() => {
              onResolve("local");
              onClose();
            }}
          >
            Keep this device
          </Button>
        </div>

        {/* Cloud version column */}
        <div className="conflict-card rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-[var(--iris)] uppercase">
              Cloud Version
            </span>
            <small className="text-xs text-[var(--muted)]">
              {formatDate(cloudNote.updatedAtMs)}
            </small>
          </div>
          <Heading level={3} className="mb-1 text-base font-medium">
            {cloudNote.title}
          </Heading>
          <p className="mb-4 max-h-48 overflow-y-auto rounded bg-[var(--subtle)] p-2 text-xs whitespace-pre-wrap text-[var(--muted)]">
            {cloudNote.content.slice(0, 300)}
            {cloudNote.content.length > 300 ? "…" : ""}
          </p>
          <Button
            className="full border border-[var(--border)]"
            onClick={() => {
              onResolve("cloud");
              onClose();
            }}
          >
            Use cloud version
          </Button>
        </div>
      </div>
    </Modal>
  );
}
