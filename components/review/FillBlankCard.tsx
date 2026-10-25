"use client";

import React, { useEffect, useState } from "react";

import { ArrowRight, Volume2 } from "lucide-react";

import type { ReviewCard } from "~/types";

import { Button, Input } from "~/components/ui";
import { normalize } from "~/lib/demoData";

export function FillBlankCard({
  card,
  onGrade,
}: {
  card: ReviewCard;
  onGrade: (ok: boolean) => void;
}) {
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [card.id]);

  const sentence =
    card.contexts?.[0]?.sentence ||
    card.exampleContext ||
    `This is a sentence containing ${card.text}.`;
  // Replace word with blank
  const regex = new RegExp(`\\b${card.text}\\b`, "ig");
  const maskedSentence = sentence.replace(regex, " __________ ");

  const oneEdit = (a: string, b: string) => {
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0;
    let j = 0;
    let n = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) {
        i++;
        j++;
      } else {
        if (++n > 1) return false;
        if (a.length >= b.length) i++;
        if (b.length >= a.length) j++;
      }
    }
    return n + (a.length - i) + (b.length - j) <= 1;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (feedback) {
      onGrade(feedback.startsWith("Correct"));
      setAnswer("");
      setFeedback("");
      return;
    }

    const typed = normalize(answer);
    const target = normalize(card.text);

    if (typed === target) {
      setFeedback("Correct — well remembered.");
    } else if (typed && oneEdit(typed, target)) {
      setFeedback(`Correct — small typo accepted. Original: ${card.text}`);
    } else {
      setFeedback(`Keep practicing. The word is “${card.text}”.`);
    }
  };

  return (
    <div className="flashcard blank-card">
      <span className="page-eyebrow">FIND THE MISSING WORD</span>
      <p>{maskedSentence}</p>
      <small>{card.meaning || card.translation}</small>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <Input
          aria-label="Missing word"
          autoFocus
          placeholder="Type the missing word"
          value={answer}
          disabled={!!feedback}
          onChange={(e) => setAnswer(e.target.value)}
        />

        {feedback && (
          <div className="space-y-2">
            <p
              className={
                feedback.startsWith("Correct") ? "feedback success" : "feedback"
              }
              role="status"
            >
              {feedback}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-[var(--secondary)] italic">
              <span>“{sentence}”</span>
              <Button
                type="button"
                className={`icon-button ${isSpeaking ? "playing text-[var(--iris)]" : ""}`}
                aria-label="Listen to example sentence"
                title="Listen to sentence"
                onClick={() => speak(sentence)}
              >
                <Volume2 size={15} />
              </Button>
            </div>
          </div>
        )}

        <Button className="primary full" disabled={!answer.trim() && !feedback}>
          {feedback ? "Next word" : "Check answer"}
          <ArrowRight size={15} />
        </Button>
      </form>
    </div>
  );
}
