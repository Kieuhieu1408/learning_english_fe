"use client";

import React, { useEffect, useState } from "react";

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
  const [speakingTarget, setSpeakingTarget] = useState<
    "word" | "sentence" | null
  >(null);

  const speak = (text: string, target?: "word" | "sentence") => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      if (target) {
        setSpeakingTarget(target);
        utterance.onend = () => setSpeakingTarget(null);
        utterance.onerror = () => setSpeakingTarget(null);
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingTarget(null);
  }, [card.id, flipped]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const primaryContext = card.contexts?.[0];
  const primarySentence = primaryContext?.sentence || card.exampleContext;

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
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        speak(card.text, "word");
      }
      if ((e.key === "s" || e.key === "S") && flipped && primarySentence) {
        e.preventDefault();
        speak(primarySentence, "sentence");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flipped, onGrade, setFlipped, card.text, primarySentence]);

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
            className={`icon-button ${speakingTarget === "word" ? "playing" : ""}`}
            aria-label="Play pronunciation"
            title="Pronounce word (R)"
            onClick={(e) => {
              e.stopPropagation();
              speak(card.text, "word");
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

          {flipped && primarySentence && (
            <div className="flash-context">
              <div className="flash-sentence-wrapper">
                <p>“{primarySentence}”</p>
                <Button
                  className={`icon-button flash-sentence-speak ${speakingTarget === "sentence" ? "playing" : ""}`}
                  aria-label="Listen to example sentence"
                  title="Listen to example sentence (S)"
                  onClick={(e) => {
                    e.stopPropagation();
                    speak(primarySentence, "sentence");
                  }}
                >
                  <Volume2 size={16} />
                </Button>
              </div>
              {primaryContext && (
                <small>
                  <BookOpen size={12} />
                  {primaryContext.noteTitle || "Note"} ·{" "}
                  {card.contexts?.length || 1} context(s)
                </small>
              )}
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
