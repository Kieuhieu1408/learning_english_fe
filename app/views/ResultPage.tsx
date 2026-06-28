"use client";

import React from "react";

import { useLiveQuery } from "dexie-react-hooks";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
} from "lucide-react";

import type { WordOffline } from "../../lib/db";

import { db } from "../../lib/db";

interface ResultPageProps {
  onBack: () => void;
}

export default function ResultPage({ onBack }: ResultPageProps) {
  const allWords = useLiveQuery(() => db.words.toArray()) || [];

  const todayStr = new Date().toISOString().split("T")[0] || "";

  const masteredWords = allWords.filter((w) => w.status === "MASTERED");
  const learningWords = allWords.filter((w) => w.status === "LEARNING");
  const newWords = allWords.filter((w) => w.status === "NEW");

  // Today's reviewed words (words whose nextReviewAt was updated today)
  const todayReviewed = allWords.filter((w) => {
    const updatedDate = new Date(w.updatedAtMs).toISOString().split("T")[0];
    return updatedDate === todayStr && w.status !== "NEW";
  });

  const totalReviewed = todayReviewed.length;
  const correctToday = todayReviewed.filter((w) => w.correctStreak > 0).length;
  const incorrectToday = totalReviewed - correctToday;

  const statusColor = (status: string) => {
    switch (status) {
      case "MASTERED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "LEARNING":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "NEW":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  return (
    <div className="min-h-screen overflow-y-auto bg-slate-950 text-slate-100">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
          <button
            onClick={onBack}
            className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 transition-all hover:border-slate-700 hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-xl font-extrabold text-transparent">
              Review Results
            </h1>
            <p className="mt-0.5 text-[10px] text-slate-500">
              Your vocabulary learning progress and review history
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
        {/* Today's Stats Cards */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-indigo-500/10 p-1.5">
              <TrendingUp className="h-4 w-4 text-indigo-400" />
            </div>
            <h2 className="text-sm font-bold tracking-wider text-white uppercase">
              Today&apos;s Review
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Total Reviewed */}
            <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-indigo-500/10 p-2">
                  <BookOpen className="h-4 w-4 text-indigo-400" />
                </div>
                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                  Total Reviewed
                </span>
              </div>
              <p className="text-3xl font-extrabold text-white">
                {totalReviewed}
              </p>
            </div>

            {/* Correct */}
            <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-500/10 p-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                  Correct
                </span>
              </div>
              <p className="text-3xl font-extrabold text-emerald-400">
                {correctToday}
              </p>
            </div>

            {/* Incorrect */}
            <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-rose-500/10 p-2">
                  <Clock className="h-4 w-4 text-rose-400" />
                </div>
                <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
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
            <div className="rounded-lg bg-amber-500/10 p-1.5">
              <Trophy className="h-4 w-4 text-amber-400" />
            </div>
            <h2 className="text-sm font-bold tracking-wider text-white uppercase">
              Overall Progress
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            {/* Progress bar */}
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-3 flex-1 overflow-hidden rounded-full bg-slate-800">
                {allWords.length > 0 && (
                  <>
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{
                        width: `${(masteredWords.length / allWords.length) * 100}%`,
                      }}
                    />
                    <div
                      className="h-full bg-amber-500 transition-all duration-500"
                      style={{
                        width: `${(learningWords.length / allWords.length) * 100}%`,
                      }}
                    />
                    <div
                      className="h-full bg-indigo-500 transition-all duration-500"
                      style={{
                        width: `${(newWords.length / allWords.length) * 100}%`,
                      }}
                    />
                  </>
                )}
              </div>
              <span className="min-w-[60px] text-right text-xs font-semibold text-slate-500">
                {allWords.length} total
              </span>
            </div>

            <div className="flex items-center gap-6 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-400">
                  Mastered ({masteredWords.length})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-400">
                  Learning ({learningWords.length})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                <span className="text-slate-400">New ({newWords.length})</span>
              </div>
            </div>
          </div>
        </section>

        {/* Word List */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-purple-500/10 p-1.5">
              <Sparkles className="h-4 w-4 text-purple-400" />
            </div>
            <h2 className="text-sm font-bold tracking-wider text-white uppercase">
              All Words ({allWords.length})
            </h2>
          </div>

          {allWords.length === 0 ?
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
              <BookOpen className="mx-auto mb-2 h-10 w-10 text-slate-700" />
              <p className="text-sm text-slate-500">
                No words yet. Start adding vocabulary in the editor!
              </p>
            </div>
          : <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 border-b border-slate-800 px-5 py-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                <div className="col-span-3">Word</div>
                <div className="col-span-3">Translation</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1">Streak</div>
                <div className="col-span-1">Interval</div>
                <div className="col-span-2">Next Review</div>
              </div>

              {/* Table Body */}
              <div className="max-h-[400px] divide-y divide-slate-800/50 overflow-y-auto">
                {allWords.map((word) => (
                  <div
                    key={word.id}
                    className="grid grid-cols-12 items-center gap-2 px-5 py-3 transition-colors hover:bg-slate-800/30"
                  >
                    <div className="col-span-3">
                      <p className="truncate text-sm font-semibold text-white">
                        {word.text}
                      </p>
                      {word.ipa && (
                        <p className="font-mono text-[10px] text-slate-600">
                          {word.ipa}
                        </p>
                      )}
                    </div>
                    <div className="col-span-3 truncate text-xs text-slate-400">
                      {word.translation}
                    </div>
                    <div className="col-span-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusColor(word.status)}`}
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
          }
        </section>

        {/* Bottom spacing */}
        <div className="h-8" />
      </div>
    </div>
  );
}
