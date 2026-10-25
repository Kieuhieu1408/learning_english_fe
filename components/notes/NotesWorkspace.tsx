"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Check, MessageSquare, MoreHorizontal, Plus } from "lucide-react";

import type { PopoverSelection } from "~/components/popovers/WordPopover";
import type { NoteOffline } from "~/lib/db";
import type { WordWithContexts } from "~/services/words";

import { Button, Heading } from "~/components/ui";
import { normalize } from "~/lib/demoData";
import {
  readingHtml,
  readingWordRange,
  segmentReading,
  stackAnnotations,
} from "~/lib/reading";

import { InlineEditor } from "./InlineEditor";
import { MarginRail } from "./MarginRail";

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
  const [draftTitle, setDraftTitle] = useState(note?.title || "");
  const [draftContent, setDraftContent] = useState(note?.content || "");
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [positions, setPositions] = useState<
    ReturnType<typeof stackAnnotations>
  >([]);
  const [decorationVersion, setDecorationVersion] = useState(0);
  const [showWordNotes, setShowWordNotes] = useState(true);

  useEffect(() => {
    if (window.localStorage.getItem("note-word-notes-visible") === "false") {
      setShowWordNotes(false);
    }
  }, []);

  const toggleWordNotes = () =>
    setShowWordNotes((prev) => {
      window.localStorage.setItem("note-word-notes-visible", String(!prev));
      return !prev;
    });

  const bodyRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLElement>(null);

  // Sync draft whenever note switches
  useEffect(() => {
    if (note) {
      setDraftTitle(note.title);
      setDraftContent(note.content);
      setSelectedWordId(null);
    }
  }, [note?.id]);

  const hasUnsavedChanges =
    !!note &&
    (draftTitle !== (note.title || "") ||
      draftContent !== (note.content || ""));

  const saveNote = useCallback(async () => {
    if (!note || !hasUnsavedChanges) return;
    await onSaveNote({
      title: draftTitle.trim() || "Untitled",
      content: draftContent,
    });
  }, [note, hasUnsavedChanges, draftTitle, draftContent, onSaveNote]);

  // Keyboard shortcut Ctrl/Cmd + S
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveNote();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveNote]);

  const onDecorated = useCallback(() => setDecorationVersion((v) => v + 1), []);

  const noteWords = useMemo(
    () =>
      savedWords.filter((w) => w.contexts.some((c) => c.noteId === note?.id)),
    [savedWords, note?.id],
  );

  const paragraphs = useMemo(
    () =>
      draftContent.split("\n\n").map((text) => segmentReading(text, noteWords)),
    [draftContent, noteWords],
  );

  const orderedWords = useMemo(() => {
    const seen = new Set<string>();
    return paragraphs.flat().flatMap((segment) => {
      if (!segment.word || seen.has(segment.word.id)) return [];
      seen.add(segment.word.id);
      return [segment.word];
    });
  }, [paragraphs]);

  const formatContent = useCallback(
    (text: string) => readingHtml(text, noteWords),
    [noteWords],
  );

  const speak = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      window.speechSynthesis.speak(u);
    }
  };

  const handleSelectText = () => {
    const s = window.getSelection();
    if (
      !s ||
      s.isCollapsed ||
      !articleRef.current?.contains(s.anchorNode) ||
      !articleRef.current.contains(s.focusNode)
    ) {
      return;
    }

    const text = s.toString().trim();
    if (!text || text.length > 80) return;

    const range = s.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    const before = range.cloneRange();
    before.selectNodeContents(articleRef.current);
    before.setEnd(range.startContainer, range.startOffset);
    const offset = before.toString().length;
    const content = articleRef.current.textContent || "";

    const start =
      Math.max(
        content.lastIndexOf(".", offset - 1),
        content.lastIndexOf("!", offset - 1),
        content.lastIndexOf("?", offset - 1),
      ) + 1;
    const end = content.slice(offset + text.length).search(/[.!?]/);
    const sentence = content
      .slice(start, end < 0 ? content.length : offset + text.length + end + 1)
      .trim();

    const norm = normalize(text);
    const existing = savedWords.find((w) => normalize(w.text) === norm);

    onOpenSelection({
      text: norm,
      sentence: sentence || text,
      x: Math.max(16, Math.min(rect.left, window.innerWidth - 354)),
      y:
        rect.bottom + 420 > window.innerHeight ?
          Math.max(70, rect.top - 390)
        : rect.bottom + 12,
      stage: "translated",
      meaning: existing?.meaning || existing?.translation || "",
      translation: existing?.contexts?.[0]?.translation || "",
      ipa: existing?.ipa || "",
      pos: existing?.contexts?.[0]?.partOfSpeech || "",
    });
  };

  // Stacked annotations alignment
  useLayoutEffect(() => {
    if (!orderedWords.length) {
      setPositions([]);
      return;
    }

    let frame = 0;
    let disposed = false;

    const measure = () => {
      if (!bodyRef.current || !articleRef.current) return;
      const bodyTop = bodyRef.current.getBoundingClientRect().top;

      const anchors = orderedWords.flatMap((word) => {
        // Direct lookup of the rendered span for pixel-perfect line matching
        const span = articleRef.current?.querySelector<HTMLElement>(
          `[data-word-id="${word.id}"]`,
        );
        let anchorTop = 0;
        if (span) {
          anchorTop = span.getBoundingClientRect().top - bodyTop;
        } else {
          const anchor =
            articleRef.current &&
            readingWordRange(articleRef.current, word.text);
          if (!anchor) return [];
          anchorTop = anchor.getBoundingClientRect().top - bodyTop;
        }

        const card = railRef.current?.querySelector<HTMLElement>(
          `[data-note-id="${word.id}"]`,
        );
        return card ?
            [
              {
                id: word.id,
                anchorTop,
                height: card.getBoundingClientRect().height,
              },
            ]
          : [];
      });

      // Stacking logic: if 1 line has 2 or more words, they stack vertically
      const next = stackAnnotations(anchors, 10);
      setPositions((prev) =>
        JSON.stringify(prev) === JSON.stringify(next) ? prev : next,
      );
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    const observer = new ResizeObserver(schedule);
    const mutations = new MutationObserver(schedule);

    if (bodyRef.current) observer.observe(bodyRef.current);
    if (articleRef.current) {
      observer.observe(articleRef.current);
      mutations.observe(articleRef.current, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    railRef.current
      ?.querySelectorAll<HTMLElement>("[data-note-id]")
      .forEach((card) => observer.observe(card));

    window.addEventListener("resize", schedule);
    document.fonts?.ready?.then(() => {
      if (!disposed) schedule();
    });
    schedule();

    return () => {
      disposed = true;
      observer.disconnect();
      mutations.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
    };
  }, [orderedWords, selectedWordId, decorationVersion, showWordNotes]);

  // Toggle selection highlight in article
  useLayoutEffect(() => {
    articleRef.current
      ?.querySelectorAll<HTMLElement>("[data-word-id]")
      .forEach((element) => {
        element.classList.toggle(
          "is-selected",
          element.dataset.wordId === selectedWordId,
        );
      });
  });

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

  const lastPos = positions[positions.length - 1];
  const railHeight = lastPos ? lastPos.top + lastPos.height + 24 : 0;

  const hasWords = orderedWords.length > 0;

  return (
    <div className="notes-workspace reading-workspace">
      {/* Clean Notion-style note status toolbar */}
      <div className="note-toolbar">
        <div className="flex items-center gap-2">
          <span
            className={`tiny-dot ${hasUnsavedChanges ? "bg-[#d97706]" : ""}`}
          />
          <span className="text-xs text-[var(--muted)]">
            {hasUnsavedChanges ? "Unsaved changes" : "All changes saved"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            className={`icon-button word-notes-toggle ${
              showWordNotes ? "is-active" : ""
            }`}
            aria-label={
              showWordNotes ? "Hide vocabulary panel" : "Show vocabulary panel"
            }
            aria-pressed={showWordNotes}
            title={
              showWordNotes ? "Hide vocabulary panel" : "Show vocabulary panel"
            }
            onClick={toggleWordNotes}
          >
            <MessageSquare size={16} />
          </Button>

          <Button
            className={`reader-save ${
              hasUnsavedChanges ? "primary is-dirty" : "reader-save-clean"
            }`}
            disabled={!hasUnsavedChanges}
            onClick={saveNote}
            title={
              hasUnsavedChanges ?
                "Save changes (Ctrl/Cmd + S)"
              : "All changes saved"
            }
          >
            <Check size={14} />
            <span>Save</span>
          </Button>

          <Button
            className="icon-button"
            aria-label="Note options"
            title="Note options"
            onClick={onManageNote}
          >
            <MoreHorizontal size={17} />
          </Button>
        </div>
      </div>

      <div
        className={`reader-page ${
          hasWords && showWordNotes ? "with-word-notes" : "without-word-notes"
        }`}
      >
        {/* Title Editor */}
        <div className="reader-heading">
          <Heading>
            <InlineEditor
              label="Note title"
              placeholder="Untitled"
              className="reader-title-editor"
              value={draftTitle}
              singleLine
              onChange={setDraftTitle}
              onEnter={() => articleRef.current?.focus()}
            />
          </Heading>
        </div>

        {/* Content & Stacked Annotations Grid */}
        <div ref={bodyRef} className="reading-grid">
          <InlineEditor
            as="article"
            editorRef={articleRef}
            className="reader-article"
            label="Note content"
            placeholder="Start writing or paste your reading notes…"
            value={draftContent}
            format={formatContent}
            onChange={setDraftContent}
            onSelection={handleSelectText}
            onDecorated={onDecorated}
            onClick={(event) => {
              const element = (
                event.target as HTMLElement
              ).closest<HTMLElement>("[data-word-id]");
              const wordId = element?.dataset.wordId;
              if (wordId) {
                setSelectedWordId((prev) => (prev === wordId ? null : wordId));
                if (onSelectWord) onSelectWord(wordId);
              }
            }}
          />

          {showWordNotes && (
            <MarginRail
              railRef={railRef}
              orderedWords={orderedWords}
              positions={positions}
              selectedWordId={selectedWordId}
              railHeight={railHeight}
              onSelectWord={(id) => {
                setSelectedWordId((prev) => (prev === id ? null : id));
                if (onSelectWord) onSelectWord(id);
              }}
              onNavigateVocab={onNavigateVocab}
              onSpeak={speak}
            />
          )}
        </div>
      </div>
    </div>
  );
}
