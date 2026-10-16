"use client";

import React, { useState } from "react";

import { Button, Input, Modal } from "~/components/ui";

export function CreateModal({
  type,
  parentTopicId,
  parentTopicName,
  isOpen,
  onClose,
  onCreateTopic,
  onCreateNote,
}: {
  type: "topic" | "note";
  parentTopicId?: string;
  parentTopicName?: string;
  isOpen: boolean;
  onClose: () => void;
  onCreateTopic: (name: string) => Promise<void>;
  onCreateNote: (title: string, topicId?: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;

    setSubmitting(true);
    try {
      if (type === "topic") {
        await onCreateTopic(name.trim());
      } else {
        await onCreateNote(name.trim(), parentTopicId);
      }
      setName("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={type === "topic" ? "A new topic" : "A fresh page"}
      close={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {type === "note" && parentTopicName && (
          <p className="text-xs text-[var(--muted)]">
            Inside: <strong>{parentTopicName}</strong>
          </p>
        )}

        <label className="block text-xs font-medium text-[var(--muted)]">
          {type === "topic" ? "Topic name" : "Note title"}
          <Input
            autoFocus
            className="mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              type === "topic" ?
                "What are you curious about?"
              : "Give your thought a title"
            }
          />
        </label>

        <Button
          className="primary full"
          disabled={!name.trim() || submitting}
          type="submit"
        >
          {submitting ? "Creating…" : `Create ${type}`}
        </Button>
      </form>
    </Modal>
  );
}
