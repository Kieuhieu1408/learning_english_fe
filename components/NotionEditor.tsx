"use client";

import React, { useEffect, useRef, useState } from "react";

import { useLiveQuery } from "dexie-react-hooks";
import {
  HelpCircle,
  RefreshCw,
  Save,
  ShieldAlert,
  Sparkles,
  Trash2,
} from "lucide-react";

import type { NoteOffline, WordOffline } from "../lib/db";

import { translateWord } from "../lib/aiClient";
import { db } from "../lib/db";
import { queueLocalChange } from "../lib/syncManager";

interface NotionEditorProps {
  noteId: string | null;
  onDeleteNote: (id: string) => void;
}

export default function NotionEditor({
  noteId,
  onDeleteNote,
}: NotionEditorProps) {
  const note = useLiveQuery(
    () => (noteId ? db.notes.get(noteId) : Promise.resolve(null)),
    [noteId],
  ) as NoteOffline | null | undefined;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [popoverCoords, setPopoverCoords] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    } else {
      setTitle("");
      setContent("");
    }
  }, [note]);

  const handleSave = async () => {
    if (!noteId) return;

    const updatedNote: NoteOffline = {
      id: noteId,
      topicId: note?.topicId || null,
      title: title.trim() || "Untitled Note",
      content: content,
      version: (note?.version || 0) + 1,
      createdAtMs: note?.createdAtMs || Date.now(),
      updatedAtMs: Date.now(),
    };

    await db.notes.put(updatedNote);
    await queueLocalChange("note", noteId, "UPDATE", updatedNote);
  };

  const handleTextSelection = () => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value.substring(start, end).trim();

    if (text && text.length < 50) {
      setSelectedText(text);

      // Simple math to position popover near the selection cursor
      const rect = textarea.getBoundingClientRect();
      setPopoverCoords({
        x: rect.left + rect.width / 2 - 80,
        y: rect.top + 30,
      });
    } else {
      setPopoverCoords(null);
    }
  };

  const handleTranslateWord = async () => {
    if (!selectedText) return;
    setAiLoading(true);
    setPopoverCoords(null);
    setAiResult(null);
    setAiError(null);

    try {
      const textarea = editorRef.current;
      let sentence = "";
      if (textarea) {
        const full = textarea.value;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const prevPeriod = full.lastIndexOf(".", Math.max(0, start - 1));
        const sentenceStart = prevPeriod !== -1 ? prevPeriod + 1 : 0;
        const nextPeriod = full.indexOf(".", end);
        const sentenceEnd = nextPeriod !== -1 ? nextPeriod + 1 : full.length;
        sentence = full.substring(sentenceStart, sentenceEnd).trim();
      }

      const result = await translateWord(selectedText, sentence);

      setAiResult(result);

      // Save word offline in Dexie db
      const newWord: WordOffline = {
        id: crypto.randomUUID(),
        noteId: noteId,
        text: result.text || selectedText,
        translation: result.translation || "",
        partOfSpeech: result.partOfSpeech || "Noun",
        ipa: result.ipa || "",
        exampleContext: result.exampleContext || "",
        exampleTranslation: result.exampleTranslation || "",
        status: "NEW",
        correctStreak: 0,
        difficulty: 0.3,
        intervalDays: 1,
        nextReviewAt: new Date().toISOString().split("T")[0] || "",
        failedEssayStreak: 0,
        version: 1,
        createdAtMs: Date.now(),
        updatedAtMs: Date.now(),
      };

      await db.words.put(newWord);
      await queueLocalChange("word", newWord.id, "CREATE", newWord);
    } catch (err: any) {
      console.error("Translation failed:", err);
      setAiError(
        err.message ||
          "Translation failed. Please make sure your AI configuration is set up properly.",
      );
    } finally {
      setAiLoading(false);
    }
  };

  if (!noteId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-transparent p-8 text-center text-slate-500 dark:text-slate-400">
        <HelpCircle className="mb-2 h-12 w-12 text-slate-400 dark:text-slate-600" />
        <p className="text-sm font-medium">
          Select or create a note on the sidebar to get started
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-transparent text-slate-900 dark:text-slate-100">
      {/* Editor Controls */}
      <div className="flex items-center justify-between border-b border-slate-200/80 bg-white/40 p-4 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/40">
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-xs font-bold tracking-wide text-indigo-600 uppercase dark:text-indigo-400">
            Notion Editor
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-500"
          >
            <Save className="h-3.5 w-3.5" />
            Save changes
          </button>
          <button
            onClick={() => onDeleteNote(noteId)}
            className="rounded-xl border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm transition-colors hover:bg-rose-50 hover:text-rose-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
            title="Delete this note"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Editor Inputs */}
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-6 overflow-y-auto p-8">
        <input
          type="text"
          placeholder="Ghi tiêu đề ở đây..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border-none bg-transparent text-3xl font-extrabold text-slate-900 placeholder-slate-400 transition-colors focus:outline-none dark:text-white dark:placeholder-slate-700"
        />

        <textarea
          ref={editorRef}
          placeholder="Hãy viết nội dung bài đọc hoặc ghi chú tại đây. Bôi đen bất kỳ từ vựng nào để kích hoạt trợ lý dịch thuật AI dịch nghĩa, điền IPA và tạo câu ngữ cảnh học từ..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onMouseUp={handleTextSelection}
          onKeyUp={handleTextSelection}
          className="w-full flex-1 resize-none border-none bg-transparent text-base leading-relaxed text-slate-800 placeholder-slate-400 transition-colors focus:outline-none dark:text-slate-300 dark:placeholder-slate-600"
        />
      </div>

      {/* AI Popover Trigger */}
      {popoverCoords && (
        <div
          style={{ left: `${popoverCoords.x}px`, top: `${popoverCoords.y}px` }}
          className="animate-in fade-in zoom-in-95 absolute z-50 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 text-slate-900 shadow-2xl duration-100 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        >
          <button
            onClick={handleTranslateWord}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            Translate with AI
          </button>
        </div>
      )}

      {/* AI Result Alert Popover */}
      {aiResult && (
        <div className="animate-in slide-in-from-bottom fixed right-6 bottom-6 z-50 max-w-sm space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl duration-300 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between">
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
              <Sparkles className="h-4 w-4 text-amber-500 dark:text-amber-300" />
              Saved to Dictionary
            </h3>
            <button
              onClick={() => setAiResult(null)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            >
              Close
            </button>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
              {aiResult.text}{" "}
              <span className="text-[11px] font-normal text-slate-500">
                ({aiResult.partOfSpeech})
              </span>
            </p>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {aiResult.translation}
            </p>
            {aiResult.ipa && (
              <p className="w-max rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {aiResult.ipa}
              </p>
            )}
          </div>
        </div>
      )}

      {/* AI Error Alert Popover */}
      {aiError && (
        <div className="animate-in slide-in-from-bottom fixed right-6 bottom-6 z-50 max-w-sm space-y-3 rounded-2xl border border-rose-200 bg-white p-5 shadow-2xl duration-300 dark:border-rose-500/30 dark:bg-slate-900">
          <div className="flex items-start justify-between">
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-rose-600 dark:text-rose-400">
              <ShieldAlert className="h-4 w-4 text-rose-500 dark:text-rose-400" />
              Translation Failed
            </h3>
            <button
              onClick={() => setAiError(null)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            >
              Close
            </button>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs leading-relaxed font-medium text-slate-700 dark:text-slate-300">
              {aiError}
            </p>
          </div>
        </div>
      )}

      {aiLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/10 backdrop-blur-[2px] dark:bg-slate-950/20">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <RefreshCw className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-500" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              AI is generating vocabulary card...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
