"use client";

import React from "react";

import { AlertTriangle, ShieldAlert } from "lucide-react";

interface ConflictResolverModalProps {
  isOpen: boolean;
  localVersion: any;
  remoteVersion: any;
  onResolve: (chosen: "local" | "remote") => void;
  onClose: () => void;
}

export default function ConflictResolverModal({
  isOpen,
  localVersion,
  remoteVersion,
  onResolve,
  onClose,
}: ConflictResolverModalProps) {
  if (!isOpen || !localVersion || !remoteVersion) return null;

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm duration-200">
      <div className="animate-in zoom-in-95 w-full max-w-2xl space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl duration-200">
        {/* Header Warning */}
        <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
          <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              Sync Version Conflict Detected
            </h2>
            <p className="text-xs text-slate-500">
              The same note/card was edited on another device. Please choose
              which version you want to keep.
            </p>
          </div>
        </div>

        {/* Versions Side-by-side */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Local Version (Client) */}
          <div className="flex flex-col justify-between space-y-4 rounded-xl border border-slate-800/80 bg-slate-950 p-4">
            <div className="space-y-2">
              <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-indigo-400 uppercase">
                This Device (Local)
              </span>
              <h3 className="text-sm font-bold text-white">
                {localVersion.title || localVersion.text}
              </h3>
              <p className="max-h-40 overflow-y-auto text-xs leading-relaxed text-slate-400">
                {localVersion.content || localVersion.translation}
              </p>
            </div>
            <button
              onClick={() => onResolve("local")}
              className="w-full rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-500"
            >
              Keep My Local Version
            </button>
          </div>

          {/* Remote Version (Server) */}
          <div className="flex flex-col justify-between space-y-4 rounded-xl border border-slate-800/80 bg-slate-950 p-4">
            <div className="space-y-2">
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-emerald-400 uppercase">
                Cloud Version (Remote)
              </span>
              <h3 className="text-sm font-bold text-white">
                {remoteVersion.title || remoteVersion.text}
              </h3>
              <p className="max-h-40 overflow-y-auto text-xs leading-relaxed text-slate-400">
                {remoteVersion.content || remoteVersion.translation}
              </p>
            </div>
            <button
              onClick={() => onResolve("remote")}
              className="w-full rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500"
            >
              Apply Cloud Version
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-800/50 bg-slate-950 p-2.5 text-[10px] text-slate-500">
          <ShieldAlert className="h-4 w-4 flex-shrink-0 text-slate-500" />
          <span>
            Selecting a version overrides the other one permanently on the next
            synchronization block.
          </span>
        </div>
      </div>
    </div>
  );
}
