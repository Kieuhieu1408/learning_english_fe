'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type TopicOffline } from '../lib/db';
import { queueLocalChange } from '../lib/syncManager';
import { Folder, FolderPlus, FileText, FilePlus, ChevronDown, ChevronRight, Settings, LogOut, RefreshCw, GraduationCap } from 'lucide-react';

interface LeftbarProps {
  onSelectNote: (noteId: string) => void;
  activeNoteId: string | null;
  onSync: () => void;
  syncStatus: string;
  onOpenSettings?: () => void;
  onOpenTest?: () => void;
}

export default function Leftbar({ onSelectNote, activeNoteId, onSync, syncStatus, onOpenSettings, onOpenTest }: LeftbarProps) {
  const topics = useLiveQuery(() => db.topics.toArray()) || [];
  const notes = useLiveQuery(() => db.notes.toArray()) || [];
  
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [newTopicName, setNewTopicName] = useState('');
  const [showAddTopic, setShowAddTopic] = useState(false);

  const handleLogout = async () => {
    try {
      await db.transaction('rw', [db.topics, db.notes, db.words, db.syncQueue, db.syncMetadata], async () => {
        await db.topics.clear();
        await db.notes.clear();
        await db.words.clear();
        await db.syncQueue.clear();
        await db.syncMetadata.clear();
      });
    } catch (err) {
      console.error('Failed to clear local database on logout:', err);
    }
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('username');
    window.location.reload();
  };

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;

    const newTopic: TopicOffline = {
      id: crypto.randomUUID(),
      name: newTopicName.trim(),
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
    };

    await db.topics.put(newTopic);
    await queueLocalChange('topic', newTopic.id, 'CREATE', newTopic);
    setNewTopicName('');
    setShowAddTopic(false);
  };

  const handleAddNote = async (topicId: string) => {
    const newNote = {
      id: crypto.randomUUID(),
      topicId: topicId,
      title: 'Untitled Note',
      content: '',
      version: 1,
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
    };

    await db.notes.put(newNote);
    await queueLocalChange('note', newNote.id, 'CREATE', newNote);
    onSelectNote(newNote.id);
  };

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 h-screen flex flex-col justify-between">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h1 className="text-lg font-bold text-white tracking-wide">English Notes</h1>
        <button 
          onClick={onSync} 
          className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all flex items-center gap-1.5 text-xs"
          title="Synchronize offline data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
          Sync
        </button>
      </div>

      {/* Accordion List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div className="flex justify-between items-center px-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Topics</span>
          <button 
            onClick={() => setShowAddTopic(!showAddTopic)}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>

        {showAddTopic && (
          <form onSubmit={handleAddTopic} className="px-2 flex gap-1">
            <input 
              type="text" 
              placeholder="Topic name..." 
              value={newTopicName}
              onChange={e => setNewTopicName(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 flex-1"
            />
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white rounded px-2 py-1 text-xs font-semibold">
              Add
            </button>
          </form>
        )}

        <div className="space-y-1">
          {topics.map(topic => {
            const isExpanded = expandedTopics[topic.id];
            const topicNotes = notes.filter(n => n.topicId === topic.id);

            return (
              <div key={topic.id} className="space-y-0.5">
                {/* Topic Header */}
                <div className="group flex items-center justify-between px-2 py-1.5 hover:bg-slate-800/50 rounded-lg cursor-pointer">
                  <div className="flex items-center gap-2 flex-1" onClick={() => toggleTopic(topic.id)}>
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                    <Folder className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-medium text-slate-200 truncate">{topic.name}</span>
                  </div>
                  <button 
                    onClick={() => handleAddNote(topic.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-opacity"
                    title="Add new note to topic"
                  >
                    <FilePlus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Topic Notes */}
                {isExpanded && (
                  <div className="pl-6 border-l border-slate-800 space-y-0.5 ml-4">
                    {topicNotes.length === 0 ? (
                      <span className="text-xs text-slate-600 block py-1">No notes yet</span>
                    ) : (
                      topicNotes.map(note => (
                        <div 
                          key={note.id}
                          onClick={() => onSelectNote(note.id)}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${activeNoteId === note.id ? 'bg-indigo-900/30 text-indigo-300 font-medium' : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-200'}`}
                        >
                          <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-xs truncate">{note.title}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer User Status */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/50 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
              U
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Learner</p>
              <p className="text-[10px] text-slate-500">Offline-first Mode</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onOpenTest && (
              <button 
                onClick={onOpenTest}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-indigo-400 transition-colors"
                title="Start Quiz"
              >
                <GraduationCap className="w-4 h-4" />
              </button>
            )}
            {onOpenSettings && (
              <button 
                onClick={onOpenSettings}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-indigo-400 transition-colors"
                title="AI Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={handleLogout}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

