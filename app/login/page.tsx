"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ArrowRight, BookOpen } from "lucide-react";

import { Button, Input } from "~/components/ui";
import { loginApi, registerApi } from "~/services/auth";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // If already authenticated or in guest mode, redirect to app
  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    const isGuest = localStorage.getItem("margin_guest_mode") === "true";
    if (token || isGuest) {
      router.replace("/");
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

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

    if (tab === "register" && !email.trim()) {
      setError("Please provide a valid email address.");
      return;
    }

    setLoading(true);
    try {
      if (tab === "login") {
        await loginApi({
          username: username.trim(),
          password,
        });
      } else {
        await registerApi({
          username: username.trim(),
          email: email.trim(),
          password,
        });
      }
      localStorage.removeItem("margin_guest_mode");
      router.replace("/");
    } catch (err: any) {
      setError(
        err.message ||
          "Authentication failed. Please verify your credentials or server connection.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    localStorage.setItem("margin_guest_mode", "true");
    localStorage.setItem("username", "Guest Reader");
    router.replace("/");
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--paper)] text-xs text-[var(--muted)]">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--paper)] p-4 selection:bg-[var(--iris-soft)] selection:text-[var(--iris)]">
      <div className="w-full max-w-[420px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm transition-all">
        {/* Brand Header */}
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

        {/* Mode Switcher */}
        <div className="mode-switch mb-5">
          <Button
            type="button"
            className={tab === "login" ? "chosen" : ""}
            onClick={() => {
              setTab("login");
              setError("");
            }}
          >
            Sign in
          </Button>
          <Button
            type="button"
            className={tab === "register" ? "chosen" : ""}
            onClick={() => {
              setTab("register");
              setError("");
            }}
          >
            Sign up
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50/50 p-3 text-xs leading-normal text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
          >
            {error}
          </div>
        )}

        {/* Auth Form */}
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

          {tab === "register" && (
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
                tab === "login" ? "current-password" : "new-password"
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
              tab === "login" ?
                "Signing in…"
              : "Creating account…"
            : tab === "login" ?
              "Sign in"
            : "Create account"}
          </Button>
        </form>

        {/* Guest / Offline Mode Option */}
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

        <div className="mt-4 text-center">
          <p className="text-[11px] text-[var(--muted)]">
            {tab === "login" ?
              <>
                New to margin?{" "}
                <button
                  type="button"
                  onClick={() => setTab("register")}
                  className="cursor-pointer font-medium text-[var(--iris)] hover:underline"
                >
                  Create an account
                </button>
              </>
            : <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setTab("login")}
                  className="cursor-pointer font-medium text-[var(--iris)] hover:underline"
                >
                  Sign in
                </button>
              </>
            }
          </p>
        </div>
      </div>
    </div>
  );
}
