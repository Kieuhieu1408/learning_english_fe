"use client";

import React, { useEffect, useState } from "react";

import { useLiveQuery } from "dexie-react-hooks";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  Volume2,
  XCircle,
} from "lucide-react";

import type { WordOffline } from "../lib/db";

import { db } from "../lib/db";
import { queueLocalChange } from "../lib/syncManager";

export default function QuizEngine() {
  const todayStr = new Date().toISOString().split("T")[0] || "";
  const dueWords =
    useLiveQuery(() =>
      db.words.filter((w) => w.nextReviewAt <= todayStr).toArray(),
    ) || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [essayAnswer, setEssayAnswer] = useState("");
  const [quizMode, setQuizMode] = useState<"flashcard" | "essay">("flashcard");
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(
    null,
  );

  const activeWord = dueWords[currentIndex]!;

  const handleGrade = async (quality: number) => {
    if (!activeWord) return;

    // SuperMemo-2 Spaced Repetition Algorithm Calculations
    let newStreak = activeWord.correctStreak;
    let newInterval = activeWord.intervalDays;
    let newDifficulty = activeWord.difficulty;

    if (quality >= 3) {
      newStreak += 1;
      newInterval = Math.round(newInterval * (1.5 + (5 - newDifficulty) * 0.1));
    } else {
      newStreak = 0;
      newInterval = 1;
      newDifficulty = Math.min(1.0, newDifficulty + 0.15);
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + newInterval);
    const nextReviewStr = nextDate.toISOString().split("T")[0] || "";

    const updatedWord: WordOffline = {
      ...activeWord,
      correctStreak: newStreak,
      intervalDays: newInterval,
      difficulty: newDifficulty,
      nextReviewAt: nextReviewStr,
      status: newStreak >= 4 ? "MASTERED" : "LEARNING",
      version: activeWord.version + 1,
      updatedAtMs: Date.now(),
    };

    await db.words.put(updatedWord);
    await queueLocalChange("word", activeWord.id, "UPDATE", updatedWord);

    // Record static counters increments locally
    const savedTotal = Number(
      await db.syncMetadata
        .get("totalWordCount")
        .then((res) => res?.value || "0"),
    );
    const savedDaily = Number(
      await db.syncMetadata
        .get("dailyWordCount")
        .then((res) => res?.value || "0"),
    );
    await db.syncMetadata.put({
      key: "dailyWordCount",
      value: String(savedDaily + 1),
    });

    // Transition state
    setFeedback(quality >= 3 ? "correct" : "incorrect");
    setTimeout(() => {
      setFeedback(null);
      setShowAnswer(false);
      setEssayAnswer("");
      if (currentIndex < dueWords.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        // Completed all due reviews for today
        setCurrentIndex(dueWords.length);
      }
    }, 1200);
  };

  const handleEssaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!essayAnswer.trim()) return;

    const cleanInput = essayAnswer.trim().toLowerCase();
    const cleanTarget = activeWord.text.trim().toLowerCase();

    if (cleanInput === cleanTarget) {
      handleGrade(5); // Grade 5 (Perfect match)
    } else {
      handleGrade(1); // Grade 1 (Incorrect match)
    }
  };

  if (dueWords.length === 0 || currentIndex >= dueWords.length) {
    return (
      <div className="flex flex-1 flex-col overflow-y-auto bg-transparent p-8 text-slate-900 transition-colors dark:text-slate-100">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          {/* Header bar */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-extrabold tracking-wide text-slate-900 dark:text-white">
                <Sparkles className="h-6 w-6 text-amber-500 dark:text-amber-400" />
                Dynamic Recall Quiz
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Review your vocabulary cards with AI-powered questions
              </p>
            </div>
          </div>

          <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <Volume2 className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              You are completely caught up with your vocabulary spaced
              repetition study cards for today.
            </p>
            <p className="text-xs text-slate-500">
              Keep adding more words in Notion Editor!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center bg-transparent p-6 text-slate-900 transition-colors dark:text-slate-100">
      {/* Top Selector */}
      <div className="absolute top-6 left-6 flex rounded-xl border border-slate-200 bg-white p-1 text-xs shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <button
          onClick={() => setQuizMode("flashcard")}
          className={`rounded-lg px-3.5 py-1.5 font-bold transition-all ${quizMode === "flashcard" ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}
        >
          Flashcards
        </button>
        <button
          onClick={() => setQuizMode("essay")}
          className={`rounded-lg px-3.5 py-1.5 font-bold transition-all ${quizMode === "essay" ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}
        >
          Spelling Write
        </button>
      </div>

      <div className="absolute top-6 right-6 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        Card {currentIndex + 1} of {dueWords.length} due
      </div>

      {/* Main Review Card */}
      <div className="w-full max-w-lg transform space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-xl transition-all duration-300 hover:scale-[1.01] dark:border-slate-800 dark:bg-slate-900">
        {quizMode === "flashcard" ?
          /* FLASHCARD INTERFACE */
          <div className="flex min-h-[180px] flex-col justify-between space-y-6">
            <div className="space-y-2 text-center">
              <span className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold tracking-wider text-indigo-600 uppercase dark:border-indigo-800/50 dark:bg-indigo-500/10 dark:text-indigo-400">
                {activeWord.partOfSpeech}
              </span>
              <h1 className="text-4xl font-extrabold tracking-wide text-slate-900 dark:text-white">
                {activeWord.text}
              </h1>
              {activeWord.ipa && (
                <p className="font-mono text-xs text-slate-500">
                  {activeWord.ipa}
                </p>
              )}
            </div>

            {showAnswer ?
              <div className="animate-in fade-in space-y-4 border-t border-slate-100 pt-4 duration-300 dark:border-slate-800/80">
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {activeWord.translation}
                  </p>
                </div>
                {activeWord.exampleContext && (
                  <div className="space-y-1 rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs text-slate-600 dark:border-slate-800/50 dark:bg-slate-950 dark:text-slate-400">
                    <p className="font-medium italic">
                      "{activeWord.exampleContext}"
                    </p>
                    {activeWord.exampleTranslation && (
                      <p className="text-[10px] text-slate-500">
                        {activeWord.exampleTranslation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            : <button
                onClick={() => setShowAnswer(true)}
                className="w-full rounded-xl bg-slate-100 py-3 text-xs font-bold text-slate-800 shadow-sm transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
              >
                Reveal meaning
              </button>
            }

            {showAnswer && (
              <div className="flex justify-center gap-2.5 pt-2">
                <button
                  onClick={() => handleGrade(1)}
                  className="flex-1 rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-900/30"
                >
                  Forgot
                </button>
                <button
                  onClick={() => handleGrade(4)}
                  className="flex-1 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-xs font-bold text-emerald-600 transition-colors hover:bg-emerald-100 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                >
                  Remembered
                </button>
              </div>
            )}
          </div>
        : /* ESSAY / SPELLING INTERFACE */
          <form
            onSubmit={handleEssaySubmit}
            className="flex min-h-[180px] flex-col justify-between space-y-6"
          >
            <div className="space-y-1 text-center">
              <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold tracking-wider text-amber-600 uppercase dark:border-amber-800/50 dark:bg-amber-500/10 dark:text-amber-400">
                Translate this word
              </span>
              <h2 className="pt-1 text-2xl font-bold text-slate-900 dark:text-white">
                {activeWord.translation}
              </h2>
              {activeWord.partOfSpeech && (
                <p className="text-[10px] text-slate-500">
                  ({activeWord.partOfSpeech})
                </p>
              )}
            </div>

            {activeWord.exampleContext && (
              <div className="space-y-1 rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-center text-xs text-slate-600 dark:border-slate-800/50 dark:bg-slate-950 dark:text-slate-400">
                <p className="font-medium italic">
                  {/* Mask the target word in the example sentence */}"
                  {activeWord.exampleContext.replace(
                    new RegExp(activeWord.text, "gi"),
                    "_____",
                  )}
                  "
                </p>
              </div>
            )}

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Type your spelling answer..."
                value={essayAnswer}
                onChange={(e) => setEssayAnswer(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder-slate-600"
                autoComplete="off"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition-colors hover:bg-indigo-500"
              >
                Submit Answer
              </button>
            </div>
          </form>
        }
      </div>

      {/* Success/Error Overlay */}
      {feedback === "correct" && (
        <div className="animate-in fade-in absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 text-emerald-600 backdrop-blur-[2px] duration-100 dark:bg-slate-950/60 dark:text-emerald-400">
          <CheckCircle2 className="h-16 w-16 animate-bounce" />
          <span className="mt-2 text-sm font-bold">
            Correct! +1 daily streak
          </span>
        </div>
      )}

      {feedback === "incorrect" && (
        <div className="animate-in fade-in absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 text-rose-600 backdrop-blur-[2px] duration-100 dark:bg-slate-950/60 dark:text-rose-400">
          <XCircle className="h-16 w-16 animate-bounce" />
          <span className="mt-2 text-sm font-bold">
            Needs review! Streak reset
          </span>
        </div>
      )}
    </div>
  );
}
