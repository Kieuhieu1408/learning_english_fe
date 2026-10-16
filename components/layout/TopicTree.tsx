"use client";

import React from "react";

import {
  BookOpenText,
  ChevronDown,
  ChevronRight,
  FileText,
  MoreHorizontal,
  Plus,
} from "lucide-react";

import type { NoteOffline, TopicOffline } from "~/lib/db";

import { Button } from "~/components/ui";

export function TopicTree({
  topics,
  notes,
  activeNoteId,
  collapsedTopics,
  setCollapsedTopics,
  onSelectNote,
  onCreateTopic,
  onCreateNoteInTopic,
  onManageTopic,
  onCreateNewNote,
}: {
  topics: TopicOffline[];
  notes: NoteOffline[];
  activeNoteId: string | null;
  collapsedTopics: string[];
  setCollapsedTopics: React.Dispatch<React.SetStateAction<string[]>>;
  onSelectNote: (noteId: string) => void;
  onCreateTopic: () => void;
  onCreateNoteInTopic: (topicId: string) => void;
  onManageTopic: (topic: TopicOffline) => void;
  onCreateNewNote: () => void;
}) {
  const toggleTopic = (id: string) => {
    setCollapsedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  // Notes not assigned to any topic
  const unassignedNotes = notes.filter((n) => !n.topicId);

  return (
    <>
      <div className="section-label">
        <span>Private</span>
        <Button
          aria-label="Create topic"
          className="icon-button"
          onClick={onCreateTopic}
        >
          <Plus size={15} />
        </Button>
      </div>

      <div className="topic-list">
        {topics.map((topic) => {
          const isCollapsed = collapsedTopics.includes(topic.id);
          const topicNotes = notes.filter((n) => n.topicId === topic.id);

          return (
            <div key={topic.id} className="topic-group">
              <div className="topic-line">
                <Button
                  className="topic-toggle"
                  onClick={() => toggleTopic(topic.id)}
                >
                  {isCollapsed ?
                    <ChevronRight size={13} />
                  : <ChevronDown size={13} />}
                  <BookOpenText size={17} />
                  <span>{topic.name}</span>
                </Button>
                <Button
                  className="topic-add icon-button"
                  aria-label={`Create page in ${topic.name}`}
                  title="Add a page"
                  onClick={() => onCreateNoteInTopic(topic.id)}
                >
                  <Plus size={14} />
                </Button>
                <Button
                  className="topic-more icon-button"
                  aria-label={`Manage ${topic.name}`}
                  onClick={() => onManageTopic(topic)}
                >
                  <MoreHorizontal size={14} />
                </Button>
              </div>

              {!isCollapsed &&
                topicNotes.map((n) => (
                  <Button
                    key={n.id}
                    className={`note-link ${
                      activeNoteId === n.id ? "selected" : ""
                    }`}
                    onClick={() => onSelectNote(n.id)}
                  >
                    <FileText size={17} />
                    <span>{n.title}</span>
                  </Button>
                ))}
            </div>
          );
        })}

        {unassignedNotes.length > 0 && (
          <div className="topic-group">
            <div className="topic-line">
              <span className="topic-toggle text-[11px] font-medium text-[var(--muted)]">
                General Notes
              </span>
            </div>
            {unassignedNotes.map((n) => (
              <Button
                key={n.id}
                className={`note-link ${
                  activeNoteId === n.id ? "selected" : ""
                }`}
                onClick={() => onSelectNote(n.id)}
              >
                <FileText size={17} />
                <span>{n.title}</span>
              </Button>
            ))}
          </div>
        )}
      </div>

      <Button className="new-note" onClick={onCreateNewNote}>
        <Plus size={16} /> New note
      </Button>
    </>
  );
}
