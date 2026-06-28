"use client";

import React, { useEffect, useState } from "react";

import { useLiveQuery } from "dexie-react-hooks";
import {
  ArrowLeft,
  CheckCircle2,
  GraduationCap,
  Trophy,
  XCircle,
} from "lucide-react";

import type { WordOffline } from "../../lib/db";

import { db } from "../../lib/db";
import { queueLocalChange } from "../../lib/syncManager";

interface TestPageProps {
  onBack: () => void;
  onViewResults: () => void;
}

export default function TestPage({ onBack, onViewResults }: TestPageProps) {
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
  const [isComplete, setIsComplete] = useState(false);

  const activeWord = dueWords[currentIndex];

  const handleGrade = async (quality: number) => {
    if (!activeWord) return;

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

    const savedDaily = Number(
      await db.syncMetadata
        .get("dailyWordCount")
        .then((res) => res?.value || "0"),
    );
    await db.syncMetadata.put({
      key: "dailyWordCount",
      value: String(savedDaily + 1),
    });

    setFeedback(quality >= 3 ? "correct" : "incorrect");
    setTimeout(() => {
      setFeedback(null);
      setShowAnswer(false);
      setEssayAnswer("");
      if (currentIndex < dueWords.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIsComplete(true);
      }
    }, 1200);
  };

  const handleEssaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!essayAnswer.trim()) return;

    const cleanInput = essayAnswer.trim().toLowerCase();
    const cleanTarget = activeWord?.text.trim().toLowerCase();

    if (cleanInput === cleanTarget) {
      handleGrade(5);
    } else {
      handleGrade(1);
    }
  };

  // Completed state
  if (dueWords.length === 0 || isComplete) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-slate-100">
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl shadow-indigo-500/20">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white">
              {isComplete ? "Quiz Complete!" : "No Due Reviews"}
            </h2>
            <p className="mx-auto max-w-sm text-sm text-slate-500">
              {isComplete ?
                `You reviewed all ${dueWords.length} word(s) for today. Great job!`
              : "You are completely caught up with your vocabulary spaced repetition study cards for today."
              }
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onBack}
              className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-slate-800"
            >
              <ArrowLeft className="mr-1.5 inline h-3.5 w-3.5" />
              Back to Editor
            </button>
            {isComplete && (
              <button
                onClick={onViewResults}
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:from-indigo-500 hover:to-purple-500"
              >
                View Results
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-slate-100">
      {/* Top Bar */}
      <div className="absolute top-6 left-6 flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 transition-all hover:bg-slate-800 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-xs">
          <button
            onClick={() => setQuizMode("flashcard")}
            className={`rounded-md px-3 py-1.5 font-medium transition-all ${
              quizMode === "flashcard" ?
                "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-white"
            }`}
          >
            Flashcards
          </button>
          <button
            onClick={() => setQuizMode("essay")}
            className={`rounded-md px-3 py-1.5 font-medium transition-all ${
              quizMode === "essay" ?
                "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-white"
            }`}
          >
            Spelling Write
          </button>
        </div>
      </div>

      <div className="absolute top-6 right-6 text-xs font-semibold text-slate-500">
        Card {currentIndex + 1} of {dueWords.length} due
      </div>

      {/* Main Review Card */}
      <div className="w-full max-w-lg transform space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl transition-all duration-300 hover:scale-[1.01]">
        {quizMode === "flashcard" ?
          <div className="flex min-h-[180px] flex-col justify-between space-y-6">
            <div className="space-y-2 text-center">
              <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-indigo-400 uppercase">
                {activeWord?.partOfSpeech}
              </span>
              <h1 className="text-4xl font-extrabold tracking-wide text-white">
                {activeWord?.text}
              </h1>
              {activeWord?.ipa && (
                <p className="font-mono text-xs text-slate-500">
                  {activeWord.ipa}
                </p>
              )}
            </div>

            {showAnswer ?
              <div className="animate-in fade-in space-y-4 border-t border-slate-800/80 pt-4 duration-300">
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-400">
                    {activeWord?.translation}
                  </p>
                </div>
                {activeWord?.exampleContext && (
                  <div className="space-y-1 rounded-lg bg-slate-950 p-3 text-xs text-slate-400">
                    <p className="font-medium italic">
                      &quot;{activeWord.exampleContext}&quot;
                    </p>
                    {activeWord.exampleTranslation && (
                      <p className="text-[10px] text-slate-600">
                        {activeWord.exampleTranslation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            : <button
                onClick={() => setShowAnswer(true)}
                className="w-full rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-700"
              >
                Reveal meaning
              </button>
            }

            {showAnswer && (
              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={() => handleGrade(1)}
                  className="rounded-lg border border-rose-900/30 bg-rose-950/20 px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-900/30"
                >
                  Forgot
                </button>
                <button
                  onClick={() => handleGrade(4)}
                  className="rounded-lg border border-emerald-900/30 bg-emerald-950/20 px-4 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-900/30"
                >
                  Remembered
                </button>
              </div>
            )}
          </div>
        : <form
            onSubmit={handleEssaySubmit}
            className="flex min-h-[180px] flex-col justify-between space-y-6"
          >
            <div className="space-y-1 text-center">
              <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-amber-400 uppercase">
                Translate this word
              </span>
              <h2 className="text-2xl font-bold text-white">
                {activeWord?.translation}
              </h2>
              {activeWord?.partOfSpeech && (
                <p className="text-[10px] text-slate-500">
                  ({activeWord.partOfSpeech})
                </p>
              )}
            </div>

            {activeWord?.exampleContext && (
              <div className="space-y-1 rounded-lg bg-slate-950 p-3 text-center text-xs text-slate-400">
                <p className="font-medium italic">
                  &quot;
                  {activeWord.exampleContext.replace(
                    new RegExp(activeWord.text, "gi"),
                    "_____",
                  )}
                  &quot;
                </p>
              </div>
            )}

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Type your spelling answer..."
                value={essayAnswer}
                onChange={(e) => setEssayAnswer(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-center text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                autoComplete="off"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500"
              >
                Submit Answer
              </button>
            </div>
          </form>
        }
      </div>

      {/* Feedback Overlay */}
      {feedback === "correct" && (
        <div className="animate-in fade-in absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/40 text-emerald-400 backdrop-blur-[1px] duration-100">
          <CheckCircle2 className="h-16 w-16 animate-bounce" />
          <span className="mt-2 text-sm font-bold">
            Correct! +1 daily streak
          </span>
        </div>
      )}

      {feedback === "incorrect" && (
        <div className="animate-in fade-in absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/40 text-rose-400 backdrop-blur-[1px] duration-100">
          <XCircle className="h-16 w-16 animate-bounce" />
          <span className="mt-2 text-sm font-bold">
            Needs review! Streak reset
          </span>
        </div>
      )}
    </div>
  );
}
