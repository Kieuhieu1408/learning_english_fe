"use client";

import React, { useState } from "react";

import { ChevronDown, ChevronUp, Search, Volume2 } from "lucide-react";

import type { WordWithContexts } from "~/types";

import { Button, Heading, Input } from "~/components/ui";

export function VocabularyPage({
  words,
  expandedWordId,
  setExpandedWordId,
  onNavigateNote,
}: {
  words: WordWithContexts[];
  expandedWordId: string | null;
  setExpandedWordId: (id: string | null) => void;
  onNavigateNote?: (noteId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All words");
  const [sort, setSort] = useState("recent");

  const speak = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  const totalContexts = words.reduce((n, w) => n + w.contexts.length, 0);
  const masteredCount = words.filter(
    (w) => w.status?.toUpperCase() === "MASTERED",
  ).length;

  const filtered = words.filter((w) => {
    const statusMatch =
      filter === "All words" ||
      w.status?.toUpperCase() === filter.toUpperCase();
    const query = search.toLowerCase();
    const meaningStr = w.meaning || w.translation || "";
    const textMatch =
      w.text.toLowerCase().includes(query) ||
      meaningStr.toLowerCase().includes(query);
    return statusMatch && textMatch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "word") return a.text.localeCompare(b.text);
    if (sort === "review") {
      const aTime = a.nextReviewAt ? new Date(a.nextReviewAt).getTime() : 0;
      const bTime = b.nextReviewAt ? new Date(b.nextReviewAt).getTime() : 0;
      return aTime - bTime;
    }
    // "recent"
    const aTime = a.updatedAtMs || 0;
    const bTime = b.updatedAtMs || 0;
    return bTime - aTime;
  });

  const formatNextReview = (nextReviewAt?: string) => {
    if (!nextReviewAt) return "Today";
    const date = new Date(nextReviewAt);
    const now = new Date();
    const diffHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours <= 0) return "Today";
    if (diffHours <= 24) return "Tomorrow";
    const days = Math.round(diffHours / 24);
    return `In ${days} days`;
  };

  return (
    <section className="page">
      <div className="page-eyebrow">YOUR COLLECTION</div>
      <Heading>Words you’ve gathered.</Heading>
      <p className="page-description">
        Every word is a little window into a bigger world.
      </p>

      <div className="stats-strip">
        <span>
          <b>{words.length}</b> total words
        </span>
        <span>
          <b>{totalContexts}</b> contexts collected
        </span>
        <span>
          <b>{masteredCount}</b> mastered
        </span>
      </div>

      <div className="table-controls">
        <div className="search">
          <Search size={17} />
          <Input
            aria-label="Search vocabulary"
            placeholder="Search words or meanings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          aria-label="Filter status"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {["All words", "New", "Learning", "Remembered", "Mastered"].map(
            (s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ),
          )}
        </select>

        <select
          aria-label="Sort vocabulary"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="recent">Recently added</option>
          <option value="word">A → Z</option>
          <option value="review">Next review</option>
        </select>
      </div>

      <div className="vocab-table">
        <div className="table-head table-row">
          <span>WORD / MEANING</span>
          <span>STATUS</span>
          <span>CONTEXTS</span>
          <span>NEXT REVIEW</span>
          <span />
        </div>

        {sorted.map((w) => {
          const isExpanded = expandedWordId === w.id;
          const statusKey = (w.status || "NEW").toLowerCase();

          return (
            <div key={w.id}>
              <Button
                className="table-row w-full text-left"
                onClick={() => setExpandedWordId(isExpanded ? null : w.id)}
              >
                <span>
                  <strong>{w.text}</strong>
                  <small>{w.meaning || w.translation}</small>
                </span>
                <span>
                  <span className={`badge ${statusKey}`}>{w.status}</span>
                </span>
                <span>
                  {w.contexts.length} context
                  {w.contexts.length > 1 ? "s" : ""}
                </span>
                <span>{formatNextReview(w.nextReviewAt)}</span>
                {isExpanded ?
                  <ChevronUp size={15} />
                : <ChevronDown size={15} />}
              </Button>

              {isExpanded && (
                <div className="context-list">
                  <div className="context-word">
                    {w.ipa && <span>{w.ipa}</span>}
                    {(w.partOfSpeech || w.pos) && (
                      <span> · {w.partOfSpeech || w.pos}</span>
                    )}
                    <Button
                      aria-label={`Listen to ${w.text}`}
                      className="icon-button"
                      onClick={() => speak(w.text)}
                    >
                      <Volume2 size={15} />
                    </Button>
                  </div>

                  {w.contexts.map((c) => (
                    <div className="context" key={c.id}>
                      <p>“{c.sentence}”</p>
                      {c.translation && <small>{c.translation}</small>}
                      {c.noteTitle && (
                        <div className="mt-1 text-[11px] text-[var(--muted)]">
                          Source:{" "}
                          <span
                            className={
                              onNavigateNote ? "cursor-pointer underline" : ""
                            }
                            onClick={() =>
                              c.noteId && onNavigateNote?.(c.noteId)
                            }
                          >
                            {c.noteTitle}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div className="empty">
            <p>No words found.</p>
            <Button
              onClick={() => {
                setSearch("");
                setFilter("All words");
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
