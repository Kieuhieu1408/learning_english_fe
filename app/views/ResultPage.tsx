'use client';

import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type WordOffline } from '../../lib/db';
import {
  ArrowLeft,
  Trophy,
  BookOpen,
  Star,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

interface ResultPageProps {
  onBack: () => void;
}

export default function ResultPage({ onBack }: ResultPageProps) {
  const allWords = useLiveQuery(() => db.words.toArray()) || [];

  const todayStr = new Date().toISOString().split('T')[0] || '';

  const masteredWords = allWords.filter((w) => w.status === 'MASTERED');
  const learningWords = allWords.filter((w) => w.status === 'LEARNING');
  const newWords = allWords.filter((w) => w.status === 'NEW');

  // Today's reviewed words (words whose nextReviewAt was updated today)
  const todayReviewed = allWords.filter((w) => {
    const updatedDate = new Date(w.updatedAtMs).toISOString().split('T')[0];
    return updatedDate === todayStr && w.status !== 'NEW';
  });

  const totalReviewed = todayReviewed.length;
  const correctToday = todayReviewed.filter((w) => w.correctStreak > 0).length;
  const incorrectToday = totalReviewed - correctToday;

  const statusColor = (status: string) => {
    switch (status) {
      case 'MASTERED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'LEARNING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'NEW':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 transition-all text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Review Results
            </h1>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Your vocabulary learning progress and review history
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Today's Stats Cards */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/10 rounded-lg">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Today&apos;s Review
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Reviewed */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Total Reviewed
                </span>
              </div>
              <p className="text-3xl font-extrabold text-white">{totalReviewed}</p>
            </div>

            {/* Correct */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Correct
                </span>
              </div>
              <p className="text-3xl font-extrabold text-emerald-400">
                {correctToday}
              </p>
            </div>

            {/* Incorrect */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-500/10 rounded-lg">
                  <Clock className="w-4 h-4 text-rose-400" />
                </div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Needs Review
                </span>
              </div>
              <p className="text-3xl font-extrabold text-rose-400">
                {incorrectToday}
              </p>
            </div>
          </div>
        </section>

        {/* Overall Progress */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/10 rounded-lg">
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Overall Progress
            </h2>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            {/* Progress bar */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden flex">
                {allWords.length > 0 && (
                  <>
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{
                        width: `${(masteredWords.length / allWords.length) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-amber-500 h-full transition-all duration-500"
                      style={{
                        width: `${(learningWords.length / allWords.length) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-indigo-500 h-full transition-all duration-500"
                      style={{
                        width: `${(newWords.length / allWords.length) * 100}%`,
                      }}
                    />
                  </>
                )}
              </div>
              <span className="text-xs text-slate-500 font-semibold min-w-[60px] text-right">
                {allWords.length} total
              </span>
            </div>

            <div className="flex items-center gap-6 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-400">
                  Mastered ({masteredWords.length})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-400">
                  Learning ({learningWords.length})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-slate-400">New ({newWords.length})</span>
              </div>
            </div>
          </div>
        </section>

        {/* Word List */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-500/10 rounded-lg">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              All Words ({allWords.length})
            </h2>
          </div>

          {allWords.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
              <BookOpen className="w-10 h-10 text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">
                No words yet. Start adding vocabulary in the editor!
              </p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <div className="col-span-3">Word</div>
                <div className="col-span-3">Translation</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1">Streak</div>
                <div className="col-span-1">Interval</div>
                <div className="col-span-2">Next Review</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-slate-800/50 max-h-[400px] overflow-y-auto">
                {allWords.map((word) => (
                  <div
                    key={word.id}
                    className="grid grid-cols-12 gap-2 px-5 py-3 hover:bg-slate-800/30 transition-colors items-center"
                  >
                    <div className="col-span-3">
                      <p className="text-sm font-semibold text-white truncate">
                        {word.text}
                      </p>
                      {word.ipa && (
                        <p className="text-[10px] text-slate-600 font-mono">
                          {word.ipa}
                        </p>
                      )}
                    </div>
                    <div className="col-span-3 text-xs text-slate-400 truncate">
                      {word.translation}
                    </div>
                    <div className="col-span-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${statusColor(word.status)}`}
                      >
                        {word.status}
                      </span>
                    </div>
                    <div className="col-span-1 text-xs text-slate-400">
                      {word.correctStreak}×
                    </div>
                    <div className="col-span-1 text-xs text-slate-400">
                      {word.intervalDays}d
                    </div>
                    <div className="col-span-2 text-xs text-slate-500">
                      {word.nextReviewAt}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Bottom spacing */}
        <div className="h-8" />
      </div>
    </div>
  );
}
