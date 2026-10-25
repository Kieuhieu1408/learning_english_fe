"use client";

import React, { useState } from "react";

import type { UserDto } from "~/services/auth";

import { Button, Input, Modal } from "~/components/ui";
import { loginApi, registerApi } from "~/services/auth";

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserDto) => void;
}) {
  const [tab, setTab] = useState<"Sign in" | "Sign up">("Sign in");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setSubmitting(true);
    try {
      if (tab === "Sign in") {
        const res = await loginApi({ username: username.trim(), password });
        localStorage.removeItem("margin_guest_mode");
        onSuccess(res.user);
      } else {
        const res = await registerApi({
          username: username.trim(),
          email: email.trim(),
          password,
        });
        localStorage.removeItem("margin_guest_mode");
        onSuccess(res.user);
      }
      onClose();
    } catch (err: any) {
      setError(
        err.message ||
          "Authentication failed. Please verify your details or check your connection.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Welcome to your margin." close={onClose}>
      <p className="modal-description mb-3 text-sm text-[var(--muted)]">
        A small, quiet space for your curious mind.
      </p>

      <div className="mode-switch mb-4">
        {(["Sign in", "Sign up"] as const).map((t) => (
          <Button
            key={t}
            type="button"
            className={tab === t ? "chosen" : ""}
            onClick={() => {
              setTab(t);
              setError("");
            }}
          >
            {t}
          </Button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-xs font-medium text-[var(--muted)]">
          Username
          <Input
            className="mt-1"
            value={username}
            autoComplete="username"
            placeholder="your_username"
            required
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>

        {tab === "Sign up" && (
          <label className="block text-xs font-medium text-[var(--muted)]">
            Email
            <Input
              className="mt-1"
              type="email"
              value={email}
              autoComplete="email"
              placeholder="learner@example.com"
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
        )}

        <label className="block text-xs font-medium text-[var(--muted)]">
          Password
          <Input
            className="mt-1"
            type="password"
            value={password}
            autoComplete={
              tab === "Sign in" ? "current-password" : "new-password"
            }
            placeholder="••••••••"
            required
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && (
          <p role="alert" className="mt-2 text-xs text-red-500">
            {error}
          </p>
        )}

        <Button
          className="primary full mt-4"
          type="submit"
          disabled={submitting || !username.trim() || !password}
        >
          {submitting ?
            "Signing in…"
          : tab === "Sign in" ?
            "Sign in"
          : "Create account"}
        </Button>
      </form>
    </Modal>
  );
}
