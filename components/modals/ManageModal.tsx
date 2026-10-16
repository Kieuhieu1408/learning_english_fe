"use client";

import React, { useEffect, useState } from "react";

import { Trash2 } from "lucide-react";

import { Button, Input, Modal } from "~/components/ui";

export function ManageModal({
  isOpen,
  type,
  initialName,
  subtext,
  onClose,
  onSaveName,
  onDelete,
}: {
  isOpen: boolean;
  type: "topic" | "note";
  initialName: string;
  subtext?: string;
  onClose: () => void;
  onSaveName: (newName: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [name, setName] = useState(initialName);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName(initialName);
    setConfirmDelete(false);
  }, [initialName, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSaveName(name.trim());
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onDelete();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        confirmDelete ? `Delete ${type}?`
        : type === "topic" ?
          "Manage topic"
        : "Manage note"
      }
      close={onClose}
    >
      {confirmDelete ?
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            This will permanently remove{" "}
            {type === "topic" ? "this topic and all of its notes" : "this note"}
            .{subtext && ` ${subtext}`}
          </p>
          <div className="flex gap-2">
            <Button
              className="quiet flex-1"
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </Button>
            <Button
              className="danger flex-1"
              disabled={submitting}
              onClick={handleDelete}
            >
              {submitting ? "Deleting…" : "Yes, delete"}
            </Button>
          </div>
        </div>
      : <div className="space-y-4">
          <label className="block text-xs font-medium text-[var(--muted)]">
            Name
            <Input
              className="mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <Button
            className="primary full"
            disabled={!name.trim() || submitting}
            onClick={handleSave}
          >
            {submitting ? "Saving…" : "Save name"}
          </Button>

          <Button
            className="danger full"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 size={15} />
            Delete {type}
          </Button>
        </div>
      }
    </Modal>
  );
}
