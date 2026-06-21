'use client';

import React, { useState, useEffect } from 'react';
import Leftbar from '../components/Leftbar';
import NotionEditor from '../components/NotionEditor';
import QuizEngine from '../components/QuizEngine';
import DashboardCounters from '../components/DashboardCounters';
import AuthPage from '../components/AuthPage';
import ConflictResolverModal from '../components/ConflictResolverModal';
import { triggerBatchSync, getAuthHeader } from '../lib/syncManager';
import { db } from '../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'quiz'>('editor');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'offline'>('idle');
  
  // Conflict resolution states
  const [isConflictOpen, setIsConflictOpen] = useState(false);
  const [conflictLocal, setConflictLocal] = useState<any>(null);
  const [conflictRemote, setConflictRemote] = useState<any>(null);
  const [conflictResolveCallback, setConflictResolveCallback] = useState<((decision: 'local' | 'remote') => void) | null>(null);

  // Check login on client side mount
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleSync = async () => {
    if (!isAuthenticated) return;
    setSyncStatus('syncing');

    const result = await triggerBatchSync();
    if (result.status === 'SUCCESS') {
      setSyncStatus('idle');
    } else if (result.status === 'OFFLINE_MODE') {
      setSyncStatus('offline');
    } else {
      setSyncStatus('idle');
    }
  };

  const handleDeleteNote = async (id: string) => {
    await db.notes.delete(id);
    // Queue offline delete change
    await db.syncQueue.put({
      entityType: 'note',
      entityId: id,
      action: 'DELETE',
      payload: '',
      timestamp: Date.now(),
    });
    setSelectedNoteId(null);
  };

  if (!isAuthenticated) {
    return <AuthPage onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-100 font-sans">
      {/* Sidebar Topics navigation */}
      <Leftbar 
        onSelectNote={setSelectedNoteId} 
        activeNoteId={selectedNoteId}
        onSync={handleSync}
        syncStatus={syncStatus}
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
