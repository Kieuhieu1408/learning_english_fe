'use client';

import React, { useState, useRef, useEffect } from 'react';
import { db, type NoteOffline, type WordOffline } from '../lib/db';
import { queueLocalChange } from '../lib/syncManager';
import { translateWord } from '../lib/aiClient';
import { useLiveQuery } from 'dexie-react-hooks';
import { Sparkles, Save, Trash2, HelpCircle, RefreshCw, ShieldAlert } from 'lucide-react';

interface NotionEditorProps {
  noteId: string | null;
  onDeleteNote: (id: string) => void;
}

export default function NotionEditor({ noteId, onDeleteNote }: NotionEditorProps) {
  const note = useLiveQuery(() => (noteId ? db.notes.get(noteId) : Promise.resolve(null)), [noteId]) as NoteOffline | null | undefined;
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [popoverCoords, setPopoverCoords] = useState<{ x: number; y: number } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    } else {
      setTitle('');
      setContent('');
    }
  }, [note]);

  const handleSave = async () => {
    if (!noteId) return;

    const updatedNote: NoteOffline = {
      id: noteId,
      topicId: note?.topicId || null,
      title: title.trim() || 'Untitled Note',
      content: content,
      version: (note?.version || 0) + 1,
      createdAtMs: note?.createdAtMs || Date.now(),
      updatedAtMs: Date.now(),
    };

    await db.notes.put(updatedNote);
    await queueLocalChange('note', noteId, 'UPDATE', updatedNote);
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
      const result = await translateWord(selectedText);

      setAiResult(result);

      // Save word offline in Dexie db
      const newWord: WordOffline = {
        id: crypto.randomUUID(),
        noteId: noteId,
        text: result.text || selectedText,
        translation: result.translation || '',
        partOfSpeech: result.partOfSpeech || 'Noun',
        ipa: result.ipa || '',
        exampleContext: result.exampleContext || '',
        exampleTranslation: result.exampleTranslation || '',
        status: 'NEW',
        correctStreak: 0,
        difficulty: 0.3,
        intervalDays: 1,
        nextReviewAt: new Date().toISOString().split('T')[0] || '',
        failedEssayStreak: 0,
        version: 1,
        createdAtMs: Date.now(),
        updatedAtMs: Date.now()
      };

      await db.words.put(newWord);
      await queueLocalChange('word', newWord.id, 'CREATE', newWord);
    } catch (err: any) {
      console.error('Translation failed:', err);
      setAiError(err.message || 'Translation failed. Please make sure your AI configuration is set up properly.');
    } finally {
      setAiLoading(false);
    }
  };

  if (!noteId) {
    return (
      <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center text-slate-500">
        <HelpCircle className="w-12 h-12 mb-2 text-slate-700" />
        <p className="text-sm">Select or create a note on the sidebar to get started</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 flex flex-col relative">
      {/* Editor Controls */}
      <div className="p-4 border-b border-slate-900 flex justify-between items-center bg-slate-950/80 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-semibold uppercase tracking-wide">
            Notion Editor
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSave} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white transition-all shadow-lg shadow-indigo-600/10"
          >
            <Save className="w-3.5 h-3.5" />
            Save changes
          </button>
          <button 
            onClick={() => onDeleteNote(noteId)} 
            className="p-1.5 bg-slate-900 hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 border border-slate-800 rounded-lg transition-colors"
            title="Delete this note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Inputs */}
      <div className="flex-1 p-6 max-w-3xl mx-auto w-full flex flex-col space-y-4 overflow-y-auto">
        <input 
          type="text" 
          placeholder="Ghi tiêu đề ở đây..." 
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="bg-transparent border-none text-3xl font-extrabold text-white placeholder-slate-800 focus:outline-none w-full"
        />

        <textarea 
          ref={editorRef}
          placeholder="Hãy viết nội dung bài đọc hoặc ghi chú tại đây. Bôi đen bất kỳ từ vựng nào để kích hoạt trợ lý dịch thuật AI dịch nghĩa, điền IPA và tạo câu ngữ cảnh học từ..." 
          value={content}
          onChange={e => setContent(e.target.value)}
          onMouseUp={handleTextSelection}
          onKeyUp={handleTextSelection}
          className="bg-transparent border-none text-slate-300 placeholder-slate-800 focus:outline-none w-full resize-none flex-1 leading-relaxed text-sm"
        />
      </div>

      {/* AI Popover Trigger */}
      {popoverCoords && (
        <div 
          style={{ left: `${popoverCoords.x}px`, top: `${popoverCoords.y}px` }}
          className="absolute bg-slate-900 border border-slate-800 text-white rounded-lg p-1.5 shadow-xl flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-100 z-50"
        >
          <button 
            onClick={handleTranslateWord}
            className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-xs font-semibold"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            Translate with AI
          </button>
        </div>
      )}

      {/* AI Result Alert Popover */}
      {aiResult && (
        <div className="fixed bottom-6 right-6 max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-2xl space-y-2 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-300" />
              Saved to Dictionary
            </h3>
            <button 
              onClick={() => setAiResult(null)} 
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Close
            </button>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-indigo-400">
              {aiResult.text} <span className="text-[10px] text-slate-500">({aiResult.partOfSpeech})</span>
            </p>
            <p className="text-xs text-slate-400">{aiResult.translation}</p>
            {aiResult.ipa && <p className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded w-max">{aiResult.ipa}</p>}
          </div>
        </div>
      )}

      {/* AI Error Alert Popover */}
      {aiError && (
        <div className="fixed bottom-6 right-6 max-w-sm bg-slate-900 border border-rose-500/30 rounded-xl p-4 shadow-2xl space-y-2 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-bold text-rose-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Translation Failed
            </h3>
            <button 
              onClick={() => setAiError(null)} 
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Close
            </button>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-300 leading-relaxed">{aiError}</p>
          </div>
        </div>
      )}

      {aiLoading && (
        <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px] flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 flex items-center gap-3">
            <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />
            <span className="text-xs font-medium text-slate-200">AI is generating vocabulary card...</span>
          </div>
        </div>
      )}
    </div>
  );
}
