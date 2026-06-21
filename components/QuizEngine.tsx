'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type WordOffline } from '../lib/db';
import { queueLocalChange } from '../lib/syncManager';
import { CheckCircle2, XCircle, ArrowRight, BookOpen, GraduationCap, Volume2 } from 'lucide-react';

export default function QuizEngine() {
  const todayStr = new Date().toISOString().split('T')[0] || '';
  const dueWords = useLiveQuery(() => 
    db.words.filter(w => w.nextReviewAt <= todayStr).toArray()
  ) || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [essayAnswer, setEssayAnswer] = useState('');
  const [quizMode, setQuizMode] = useState<'flashcard' | 'essay'>('flashcard');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

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
    const nextReviewStr = nextDate.toISOString().split('T')[0] || '';

    const updatedWord: WordOffline = {
      ...activeWord,
      correctStreak: newStreak,
      intervalDays: newInterval,
      difficulty: newDifficulty,
      nextReviewAt: nextReviewStr,
      status: newStreak >= 4 ? 'MASTERED' : 'LEARNING',
      version: activeWord.version + 1,
      updatedAtMs: Date.now(),
    };

    await db.words.put(updatedWord);
    await queueLocalChange('word', activeWord.id, 'UPDATE', updatedWord);

    // Record static counters increments locally
    const savedTotal = Number(await db.syncMetadata.get('totalWordCount').then(res => res?.value || '0'));
    const savedDaily = Number(await db.syncMetadata.get('dailyWordCount').then(res => res?.value || '0'));
    await db.syncMetadata.put({ key: 'dailyWordCount', value: String(savedDaily + 1) });

    // Transition state
    setFeedback(quality >= 3 ? 'correct' : 'incorrect');
    setTimeout(() => {
      setFeedback(null);
      setShowAnswer(false);
      setEssayAnswer('');
      if (currentIndex < dueWords.length - 1) {
        setCurrentIndex(prev => prev + 1);
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
      <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center text-slate-400 p-6">
        <GraduationCap className="w-16 h-16 text-indigo-500 mb-3" />
        <h2 className="text-xl font-bold text-white mb-1">Hooray! No due reviews</h2>
        <p className="text-sm text-slate-500 text-center max-w-sm">
          You are completely caught up with your vocabulary spaced repetition study cards for today. Keep adding more words in Notion Editor!
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-center relative">
      {/* Top Selector */}
      <div className="absolute top-6 left-6 flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
        <button 
          onClick={() => setQuizMode('flashcard')}
          className={`px-3 py-1.5 rounded-md font-medium transition-all ${quizMode === 'flashcard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Flashcards
        </button>
        <button 
          onClick={() => setQuizMode('essay')}
          className={`px-3 py-1.5 rounded-md font-medium transition-all ${quizMode === 'essay' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Spelling Write
        </button>
      </div>

      <div className="absolute top-6 right-6 text-xs text-slate-500 font-semibold">
        Card {currentIndex + 1} of {dueWords.length} due
      </div>

      {/* Main Review Card */}
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6 transition-all transform hover:scale-[1.01] duration-300">
        
        {quizMode === 'flashcard' ? (
          /* FLASHCARD INTERFACE */
          <div className="space-y-6 min-h-[180px] flex flex-col justify-between">
            <div className="text-center space-y-2">
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                {activeWord.partOfSpeech}
              </span>
              <h1 className="text-4xl font-extrabold text-white tracking-wide">{activeWord.text}</h1>
              {activeWord.ipa && <p className="text-xs text-slate-500 font-mono">{activeWord.ipa}</p>}
            </div>

            {showAnswer ? (
              <div className="space-y-4 border-t border-slate-800/80 pt-4 animate-in fade-in duration-300">
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-400">{activeWord.translation}</p>
                </div>
                {activeWord.exampleContext && (
                  <div className="bg-slate-950 p-3 rounded-lg text-xs space-y-1 text-slate-400">
                    <p className="italic font-medium">"{activeWord.exampleContext}"</p>
                    {activeWord.exampleTranslation && <p className="text-[10px] text-slate-600">{activeWord.exampleTranslation}</p>}
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => setShowAnswer(true)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-white transition-colors"
              >
                Reveal meaning
              </button>
            )}

            {showAnswer && (
              <div className="flex gap-2 justify-center pt-2">
                <button 
                  onClick={() => handleGrade(1)} 
                  className="px-4 py-2 bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 border border-rose-900/30 rounded-lg text-xs font-semibold"
                >
                  Forgot
                </button>
                <button 
                  onClick={() => handleGrade(4)} 
                  className="px-4 py-2 bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-400 border border-emerald-900/30 rounded-lg text-xs font-semibold"
                >
                  Remembered
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ESSAY / SPELLING INTERFACE */
          <form onSubmit={handleEssaySubmit} className="space-y-6 min-h-[180px] flex flex-col justify-between">
            <div className="text-center space-y-1">
              <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                Translate this word
              </span>
              <h2 className="text-2xl font-bold text-white">{activeWord.translation}</h2>
              {activeWord.partOfSpeech && <p className="text-[10px] text-slate-500">({activeWord.partOfSpeech})</p>}
            </div>

            {activeWord.exampleContext && (
              <div className="bg-slate-950 p-3 rounded-lg text-xs space-y-1 text-slate-400 text-center">
                <p className="italic font-medium">
                  {/* Mask the target word in the example sentence */}
                  "{activeWord.exampleContext.replace(new RegExp(activeWord.text, 'gi'), '_____')}"
                </p>
              </div>
            )}

            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="Type your spelling answer..." 
                value={essayAnswer}
                onChange={e => setEssayAnswer(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-center placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-white"
                autoComplete="off"
              />
              <button 
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white transition-colors"
              >
                Submit Answer
              </button>
            </div>
          </form>
        )}

      </div>

      {/* Success/Error Overlay */}
      {feedback === 'correct' && (
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex flex-col items-center justify-center text-emerald-400 animate-in fade-in duration-100 z-50">
          <CheckCircle2 className="w-16 h-16 animate-bounce" />
          <span className="text-sm font-bold mt-2">Correct! +1 daily streak</span>
        </div>
      )}

      {feedback === 'incorrect' && (
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex flex-col items-center justify-center text-rose-400 animate-in fade-in duration-100 z-50">
          <XCircle className="w-16 h-16 animate-bounce" />
          <span className="text-sm font-bold mt-2">Needs review! Streak reset</span>
        </div>
      )}
    </div>
  );
}
