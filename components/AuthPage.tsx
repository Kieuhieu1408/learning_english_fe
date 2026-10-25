"use client";

import React, { useState } from "react";

import { ArrowRight, BookOpen } from "lucide-react";

import { loginApi, registerApi } from "../services/auth";
import { Button, Input } from "./ui";

interface AuthPageProps {
  onSuccess: () => void;
}

export default function AuthPage({ onSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Please enter your username.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (mode === "register" && !email.trim()) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await loginApi({ username: username.trim(), password });
      } else {
        await registerApi({
          username: username.trim(),
          email: email.trim(),
          password,
        });
      }
      localStorage.removeItem("margin_guest_mode");
      onSuccess();
    } catch (err: any) {
      setError(
        err.message ||
          "Authentication failed. Please check your credentials or connection.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    localStorage.setItem("margin_guest_mode", "true");
    localStorage.setItem("username", "Guest Reader");
    onSuccess();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--paper)] p-4 selection:bg-[var(--iris-soft)] selection:text-[var(--iris)]">
      <div className="w-full max-w-[420px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--subtle)] text-[var(--iris)]">
            <BookOpen size={20} />
          </div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-[var(--ink)]">
            margin.
          </h1>
          <p className="modal-description mt-2 text-xs leading-relaxed text-[var(--muted)]">
            A quiet space for thoughtful English reading, vocabulary capture,
            and spaced repetition review.
          </p>
        </div>

        <div className="mode-switch mb-5">
          <Button
            type="button"
            className={mode === "login" ? "chosen" : ""}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Sign in
          </Button>
          <Button
            type="button"
            className={mode === "register" ? "chosen" : ""}
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            Sign up
          </Button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50/50 p-3 text-xs leading-normal text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-[var(--secondary)]">
              Username
            </label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. learner"
              autoComplete="username"
              required
              disabled={loading}
            />
          </div>

          {mode === "register" && (
            <div>
              <label className="mb-1 block text-[11px] font-medium text-[var(--secondary)]">
                Email address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="learner@example.com"
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-[11px] font-medium text-[var(--secondary)]">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="primary full mt-2"
            disabled={loading || !username.trim() || !password}
          >
            {loading ?
              mode === "login" ?
                "Signing in…"
              : "Creating account…"
            : mode === "login" ?
              "Sign in"
            : "Create account"}
          </Button>
        </form>

        <div className="mt-6 border-t border-[var(--border)] pt-5 text-center">
          <button
            type="button"
            onClick={handleContinueAsGuest}
            className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-[var(--muted)] transition-colors hover:text-[var(--iris)]"
          >
            <span>Continue offline without account</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
