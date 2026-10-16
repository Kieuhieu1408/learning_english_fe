"use client";

import React from "react";

import { Button, Modal } from "~/components/ui";

export function UnsavedModal({
  isOpen,
  onClose,
  onDiscard,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onDiscard: () => void;
  onSave: () => void;
}) {
  if (!isOpen) return null;

  return (
    <Modal title="Keep your changes?" close={onClose}>
      <p className="mb-4 text-sm text-[var(--muted)]">
        You have unsaved changes in this note. Leaving now will discard your
        recent edits.
      </p>

      <div className="flex flex-col gap-2">
        <Button
          className="primary full"
          onClick={() => {
            onSave();
            onClose();
          }}
        >
          Save changes
        </Button>
        <Button
          className="danger full"
          onClick={() => {
            onDiscard();
            onClose();
          }}
        >
          Discard changes
        </Button>
      </div>
    </Modal>
  );
}
