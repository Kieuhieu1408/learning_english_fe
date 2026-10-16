"use client";

import React, { useEffect, useState } from "react";

import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCheck,
  Flame,
  Layers,
  Leaf,
} from "lucide-react";

import type { ProgressDashboardData } from "~/services/progress";

import { Button, Heading } from "~/components/ui";
import { fetchProgressDashboardApi } from "~/services/progress";

export function ProgressPage({
  onNavigateReview,
}: {
  onNavigateReview: () => void;
}) {
  const [data, setData] = useState<ProgressDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchProgressDashboardApi()
      .then((res) => {
        if (mounted) setData(res);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading || !data) {
    return (
      <section className="page">
        <div className="page-eyebrow">THE BIGGER PICTURE</div>
        <Heading>Quiet effort. Real growth.</Heading>
        <p className="page-description">Loading your progress data…</p>
      </section>
    );
  }

  const {
    accuracyPercent,
    reviewedToday,
    totalWords,
    newAddedCount,
    distribution,
    streakDays,
    activityCalendar,
  } = data;

  const distTotal = Math.max(
    1,
    distribution.new +
      distribution.learning +
      distribution.remembered +
      distribution.mastered,
  );

  return (
    <section className="page">
      <div className="page-eyebrow">THE BIGGER PICTURE</div>
      <Heading>Quiet effort. Real growth.</Heading>
      <p className="page-description">
        It all adds up, one word and one day at a time.
      </p>

      <div className="metric-grid">
        <div className="metric">
          <span>
            <CheckCheck size={17} />
            Recall accuracy
          </span>
          <b>{accuracyPercent !== null ? `${accuracyPercent}%` : "—"}</b>
          <small>
            {accuracyPercent !== null ?
              "Based on your practice history"
            : "Start a review to see your accuracy"}
          </small>
        </div>

        <div className="metric">
          <span>
            <Layers size={17} />
            Reviewed today
          </span>
          <b>
            {reviewedToday}
            <em>/ 20</em>
          </b>
          <small>Every revisit makes a difference.</small>
        </div>

        <div className="metric">
          <span>
            <BookOpen size={17} />
            Words collected
          </span>
          <b>
            {totalWords}
            <em>words</em>
          </b>
          <small>
            {newAddedCount > 0 ?
              `${newAddedCount} added recently`
            : "Explore notes to collect more words"}
          </small>
        </div>
      </div>

      <div className="progress-grid">
        <div className="panel">
          <div className="panel-title">
            <Heading level={2}>Your vocabulary, growing.</Heading>
            <span>{totalWords} words</span>
          </div>

          <div className="distribution">
            {[
              { label: "New", count: distribution.new, key: "new" },
              {
                label: "Learning",
                count: distribution.learning,
                key: "learning",
              },
              {
                label: "Remembered",
                count: distribution.remembered,
                key: "remembered",
              },
              {
                label: "Mastered",
                count: distribution.mastered,
                key: "mastered",
              },
            ].map(({ label, count, key }) => (
              <div key={key}>
                <div>
                  <span>
                    <i className={`status-dot ${key}`} />
                    {label}
                  </span>
                  <b>{count}</b>
                </div>
                <div className="bar-track">
                  <span
                    className={key}
                    style={{
                      width: `${(count / distTotal) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel consistency">
          <Flame size={25} />
          <Heading level={2}>A rhythm of your own.</Heading>
          <p>
            You’ve shown up {streakDays} days in a row.
            <br />
            Keep your curiosity company.
          </p>

          <div className="calendar">
            {activityCalendar.map((item) => (
              <span
                key={item.dayIndex}
                className={
                  item.isCurrent ? "current"
                  : item.filled ?
                    "filled"
                  : ""
                }
                title={item.count > 0 ? `${item.count} reviews` : "No reviews"}
              >
                {item.isCurrent ?
                  <Check size={13} />
                : ""}
              </span>
            ))}
          </div>

          <small>Daily practice consistency over 35 days</small>
        </div>
      </div>

      <div className="progress-callout">
        <Leaf size={23} />
        <div>
          <Heading level={3}>Progress isn’t always loud.</Heading>
          <p>Sometimes it’s just a word you didn’t have to look up again.</p>
        </div>
        <Button className="primary" onClick={onNavigateReview}>
          Keep practicing <ArrowRight size={15} />
        </Button>
      </div>
    </section>
  );
}
