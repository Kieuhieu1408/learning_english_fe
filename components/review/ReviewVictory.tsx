"use client";

import React from "react";

import { ArrowRight, CheckCheck } from "lucide-react";

import { Button, Heading } from "~/components/ui";

export function ReviewVictory({
  sessionCorrect,
  totalReviewed,
  remainingDueCount,
  onContinueReview,
  onNavigateProgress,
}: {
  sessionCorrect: number;
  totalReviewed: number;
  remainingDueCount: number;
  onContinueReview: () => void;
  onNavigateProgress: () => void;
}) {
  return (
    <div className="review-setup victory">
      <div className="review-symbol">
        <CheckCheck size={32} />
      </div>
      <span className="page-eyebrow">A SMALL WIN, WELL EARNED</span>
      <Heading level={2}>Look at you, growing.</Heading>
      <p>You made time for {totalReviewed} words. That matters.</p>

      <div className="victory-stats">
        <div>
          <b>{sessionCorrect}</b>
          <span>Remembered</span>
        </div>
        <div>
          <b>{Math.max(0, totalReviewed - sessionCorrect)}</b>
          <span>To revisit</span>
        </div>
      </div>

      <div className="mt-4 flex w-full max-w-xs flex-col gap-2">
        {remainingDueCount > 0 ?
          <Button className="primary w-full" onClick={onContinueReview}>
            Continue with {Math.min(15, remainingDueCount)} words
            <ArrowRight size={16} />
          </Button>
        : <Button className="primary w-full" onClick={onNavigateProgress}>
            View your progress
            <ArrowRight size={16} />
          </Button>
        }

        <Button className="quiet w-full" onClick={onNavigateProgress}>
          View results
        </Button>
      </div>
    </div>
  );
}
