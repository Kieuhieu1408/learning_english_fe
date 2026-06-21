'use client';

import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

interface ConflictResolverModalProps {
  isOpen: boolean;
  localVersion: any;
  remoteVersion: any;
  onResolve: (chosen: 'local' | 'remote') => void;
  onClose: () => void;
}

export default function ConflictResolverModal({ isOpen, localVersion, remoteVersion, onResolve, onClose }: ConflictResolverModalProps) {
  if (!isOpen || !localVersion || !remoteVersion) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
        
        {/* Header Warning */}
        <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Sync Version Conflict Detected</h2>
            <p className="text-xs text-slate-500">The same note/card was edited on another device. Please choose which version you want to keep.</p>
          </div>
        </div>

        {/* Versions Side-by-side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Local Version (Client) */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                This Device (Local)
              </span>
              <h3 className="text-sm font-bold text-white">{localVersion.title || localVersion.text}</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-h-40 overflow-y-auto">
                {localVersion.content || localVersion.translation}
              </p>
            </div>
            <button 
              onClick={() => onResolve('local')}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white transition-colors"
            >
              Keep My Local Version
            </button>
          </div>

          {/* Remote Version (Server) */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                Cloud Version (Remote)
              </span>
              <h3 className="text-sm font-bold text-white">{remoteVersion.title || remoteVersion.text}</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-h-40 overflow-y-auto">
                {remoteVersion.content || remoteVersion.translation}
              </p>
            </div>
            <button 
              onClick={() => onResolve('remote')}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-semibold text-white transition-colors"
            >
              Apply Cloud Version
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center gap-2 text-[10px] text-slate-500 bg-slate-950 p-2.5 rounded-lg border border-slate-800/50">
          <ShieldAlert className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <span>Selecting a version overrides the other one permanently on the next synchronization block.</span>
        </div>
      </div>
    </div>
  );
}
