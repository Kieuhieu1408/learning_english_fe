'use client';

import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { Sparkles, Calendar, Award, Cloud, CloudOff } from 'lucide-react';

interface DashboardCountersProps {
  currentTab: 'editor' | 'quiz';
  onTabChange: (tab: 'editor' | 'quiz') => void;
  syncStatus: string;
}

export default function DashboardCounters({ currentTab, onTabChange, syncStatus }: DashboardCountersProps) {
  // Real-time live queries on metadata cache
  const dailyCount = useLiveQuery(() => db.syncMetadata.get('dailyWordCount').then(res => res?.value || '0')) || '0';
  const totalCount = useLiveQuery(() => db.syncMetadata.get('totalWordCount').then(res => res?.value || '0')) || '0';

  const isOnline = syncStatus !== 'offline';

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
      {/* Tab Selectors */}
      <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
        <button 
          onClick={() => onTabChange('editor')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold transition-all ${currentTab === 'editor' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:text-white'}`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Word Editor
        </button>
        <button 
          onClick={() => onTabChange('quiz')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold transition-all ${currentTab === 'quiz' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:text-white'}`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Review Session
        </button>
      </div>

      {/* Stats and Server Sync Status */}
      <div className="flex items-center gap-6">
        {/* Daily Stats */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Today's Streak</p>
            <p className="text-sm font-extrabold text-white">{dailyCount} words</p>
          </div>
        </div>

        {/* Total Stats */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Words</p>
            <p className="text-sm font-extrabold text-white">{totalCount} cards</p>
          </div>
        </div>

        {/* Server Sync Status Indicator */}
        <div className="border-l border-slate-800 pl-6 flex items-center gap-2">
          {isOnline ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-medium">
              <Cloud className="w-3.5 h-3.5" />
              Connected
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full font-medium">
              <CloudOff className="w-3.5 h-3.5" />
              Offline
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
