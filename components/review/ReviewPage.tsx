"use client";

import React, { useEffect, useRef, useState } from "react";

import { ArrowLeft, ArrowRight, Layers, Pencil } from "lucide-react";

import type { ReviewCard } from "~/services/review";

import { Button, Heading } from "~/components/ui";
import { fetchDueCardsApi, submitReviewCardApi } from "~/services/review";

import { FillBlankCard } from "./FillBlankCard";
import { FlashcardCard } from "./FlashcardCard";
import { ReviewVictory } from "./ReviewVictory";

export function ReviewPage({
  onNavigateNotes,
  onNavigateProgress,
  onSessionReviewed,
}: {
  onNavigateNotes: () => void;
  onNavigateProgress: () => void;
  onSessionReviewed?: () => void;
}) {
  const [phase, setPhase] = useState<"setup" | "active" | "complete" | "empty">(
    "setup",
  );
  const [mode, setMode] = useState<"Flashcards" | "Fill in the blank">(
    "Flashcards",
  );
  const [queue, setQueue] = useState<ReviewCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [loading, setLoading] = useState(true);
  const lock = useRef(false);

  const loadDueCards = async () => {
    setLoading(true);
    try {
      const cards = await fetchDueCardsApi(15);
      setQueue(cards);
      if (cards.length === 0) {
        setPhase("empty");
      } else {
        setPhase("setup");
      }
    } catch {
      setPhase("empty");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDueCards();
  }, []);

  const handleStart = () => {
    if (queue.length === 0) return;
    setCurrentIndex(0);
    setSessionCorrect(0);
    setFlipped(false);
    setPhase("active");
  };

  const currentCard = queue[currentIndex];

  const handleGrade = async (ok: boolean) => {
    if (lock.current || !currentCard) return;
    lock.current = true;

    if (ok) {
      setSessionCorrect((n) => n + 1);
    }

    // Call service to apply SM-2 and log review
    await submitReviewCardApi(currentCard.id, ok, mode);
    onSessionReviewed?.();

    if (currentIndex + 1 >= queue.length) {
      setPhase("complete");
    } else {
      setCurrentIndex((n) => n + 1);
    }

    setFlipped(false);
    setTimeout(() => {
      lock.current = false;
    }, 180);
  };

  return (
    <section className="review-page">
      {loading ?
        <div className="py-12 text-center text-[var(--muted)]">
          Preparing your review cards…
        </div>
      : phase === "setup" || phase === "empty" ?
        <div className="review-setup">
          <div className="review-symbol">
            <Layers size={30} />
          </div>
          <Heading level={2}>
            {queue.length ? "Your words are ready for you." : "All caught up."}
          </Heading>
          <p>
            {queue.length ?
              `${queue.length} words to revisit · about ${Math.ceil(
                queue.length / 3,
              )} minutes`
            : "A little space to let what you learned sink in."}
          </p>

          {queue.length > 0 ?
            <>
              <div className="mode-switch">
                {(["Flashcards", "Fill in the blank"] as const).map((m) => (
                  <Button
                    key={m}
                    className={mode === m ? "chosen" : ""}
                    onClick={() => setMode(m)}
                  >
                    {m === "Flashcards" ?
                      <Layers size={16} />
                    : <Pencil size={16} />}{" "}
                    {m}
                  </Button>
                ))}
              </div>

              <Button className="primary" onClick={handleStart}>
                Begin practice <ArrowRight size={16} />
              </Button>
              <small>One focused session. Up to 15 words.</small>
            </>
          : <Button onClick={onNavigateNotes}>Back to notes</Button>}
        </div>
      : phase === "complete" ?
        <ReviewVictory
          sessionCorrect={sessionCorrect}
          totalReviewed={queue.length}
          remainingDueCount={0}
          onContinueReview={loadDueCards}
          onNavigateProgress={onNavigateProgress}
        />
      : currentCard && (
          <div className="review-active">
            <div className="review-progress">
              <Button className="quiet" onClick={() => setPhase("setup")}>
                <ArrowLeft size={14} /> Pause
              </Button>
              <span>
                {currentIndex + 1}{" "}
                <span className="muted">/ {queue.length}</span>
              </span>
              <span className="badge">{mode}</span>
            </div>

            <div className="progress-track">
              <div
                style={{
                  width: `${((currentIndex + 1) / queue.length) * 100}%`,
                }}
              />
            </div>

            {mode === "Flashcards" ?
              <FlashcardCard
                card={currentCard}
                flipped={flipped}
                setFlipped={setFlipped}
                onGrade={handleGrade}
              />
            : <FillBlankCard card={currentCard} onGrade={handleGrade} />}
          </div>
        )
      }
    </section>
  );
}
