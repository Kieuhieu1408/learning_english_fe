'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Leftbar from '../../components/Leftbar';
import NotionEditor from '../../components/NotionEditor';
import QuizEngine from '../../components/QuizEngine';
import DashboardCounters from '../../components/DashboardCounters';
import ConflictResolverModal from '../../components/ConflictResolverModal';
import { triggerBatchSync } from '../../lib/syncManager';
import { db } from '../../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

interface MainPageProps {
  onOpenSettings: () => void;
  onOpenTest: () => void;
}

export default function MainPage({ onOpenSettings, onOpenTest }: MainPageProps) {
  const [activeTab, setActiveTab] = useState<'editor' | 'quiz'>('editor');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'offline'>('idle');

  // Conflict resolution states
  const [isConflictOpen, setIsConflictOpen] = useState(false);
  const [conflictLocal, setConflictLocal] = useState<any>(null);
  const [conflictRemote, setConflictRemote] = useState<any>(null);
  const [conflictResolveCallback, setConflictResolveCallback] = useState<((decision: 'local' | 'remote') => void) | null>(null);

  const handleSync = useCallback(async () => {
    setSyncStatus('syncing');

    const result = await triggerBatchSync();
    if (result.status === 'SUCCESS') {
      setSyncStatus('idle');
    } else if (result.status === 'OFFLINE_MODE') {
      setSyncStatus('offline');
    } else {
      setSyncStatus('idle');
    }
  }, []);

  const syncQueueLength = useLiveQuery(() => db.syncQueue.count()) || 0;

  // Auto-sync on mount
  useEffect(() => {
    handleSync();
  }, [handleSync]);

  // Auto-sync when there are new changes in the queue (debounced)
  useEffect(() => {
    if (syncQueueLength > 0) {
      const timer = setTimeout(() => {
        handleSync();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [syncQueueLength, handleSync]);

  // Auto-sync when browser goes back online
  useEffect(() => {
    const handleOnline = () => {
      handleSync();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [handleSync]);

  const handleDeleteNote = async (id: string) => {
    await db.notes.delete(id);
    await db.syncQueue.put({
      entityType: 'note',
      entityId: id,
      action: 'DELETE',
      payload: '',
      timestamp: Date.now(),
    });
    setSelectedNoteId(null);
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-100 font-sans">
      {/* Sidebar Topics navigation */}
      <Leftbar
        onSelectNote={setSelectedNoteId}
        activeNoteId={selectedNoteId}
        onSync={handleSync}
        syncStatus={syncStatus}
        onOpenSettings={onOpenSettings}
        onOpenTest={onOpenTest}
      />

      {/* Main Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Dynamic header stats counters */}
        <DashboardCounters
          currentTab={activeTab}
          onTabChange={setActiveTab}
          syncStatus={syncStatus}
        />

        {/* Content body switcher */}
        <div className="flex-1 overflow-hidden flex">
          {activeTab === 'editor' ? (
            <NotionEditor
              noteId={selectedNoteId}
              onDeleteNote={handleDeleteNote}
            />
          ) : (
            <QuizEngine />
          )}
        </div>
      </div>

      {/* Popups */}
      <ConflictResolverModal
        isOpen={isConflictOpen}
        localVersion={conflictLocal}
        remoteVersion={conflictRemote}
        onResolve={(chosen) => {
          if (conflictResolveCallback) conflictResolveCallback(chosen);
          setIsConflictOpen(false);
        }}
        onClose={() => setIsConflictOpen(false)}
      />
    </div>
  );
}
