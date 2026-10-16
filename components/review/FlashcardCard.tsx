"use client";

import React, { useEffect } from "react";

import { BookOpen, RotateCcw, Volume2 } from "lucide-react";

import type { ReviewCard } from "~/types";

import { Button, Heading } from "~/components/ui";

export function FlashcardCard({
  card,
  flipped,
  setFlipped,
  onGrade,
}: {
  card: ReviewCard;
  flipped: boolean;
  setFlipped: React.Dispatch<React.SetStateAction<boolean>>;
  onGrade: (ok: boolean) => void;
}) {
  const speak = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,textarea,select,button")) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        setFlipped((prev) => !prev);
      }
      if (flipped && e.key === "1") {
        e.preventDefault();
        onGrade(false);
      }
      if (flipped && e.key === "2") {
        e.preventDefault();
        onGrade(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flipped, onGrade, setFlipped]);

  const primaryContext = card.contexts?.[0];

  return (
    <>
      <div
        className={`flashcard ${flipped ? "flipped" : ""}`}
        role="button"
        tabIndex={0}
        aria-label={
          flipped ?
            "Meaning side. Click to see word"
          : "Word side. Click to reveal meaning"
        }
        onClick={() => setFlipped(!flipped)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            setFlipped(!flipped);
          }
        }}
      >
        <div className="card-top">
          <span>{flipped ? "THE MEANING" : "TAKE A MOMENT TO REMEMBER"}</span>
          <Button
            className="icon-button"
            aria-label="Play pronunciation"
            onClick={(e) => {
              e.stopPropagation();
              speak(card.text);
            }}
          >
            <Volume2 size={19} />
          </Button>
        </div>

        <div className="flashcard-content">
          {(card.partOfSpeech || card.pos) && (
            <span className="word-pos">{card.partOfSpeech || card.pos}</span>
          )}
          <Heading level={2}>
            {flipped ? card.meaning || card.translation : card.text}
          </Heading>
          <span className="ipa">{flipped ? card.text : card.ipa || ""}</span>

          {flipped && primaryContext && (
            <div className="flash-context">
              <p>“{primaryContext.sentence}”</p>
              <small>
                <BookOpen size={12} />
                {primaryContext.noteTitle || "Note"} · {card.contexts.length}{" "}
                context(s)
              </small>
            </div>
          )}
        </div>

        <span className="flip-hint">
          <RotateCcw size={13} />
          {flipped ? "Click to see word" : "Click to reveal meaning"}
          <kbd>space</kbd>
        </span>
      </div>

      {flipped ?
        <div className="grade-actions">
          <Button onClick={() => onGrade(false)}>
            Still learning <kbd>1</kbd>
          </Button>
          <Button className="primary" onClick={() => onGrade(true)}>
            I remembered <kbd>2</kbd>
          </Button>
        </div>
      : <p className="review-help">No rush. Give your memory a moment.</p>}
    </>
  );
}
