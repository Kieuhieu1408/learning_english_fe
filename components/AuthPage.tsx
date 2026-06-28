"use client";

import React, { useState } from "react";

import { GraduationCap, Lock, Mail, ShieldAlert, User } from "lucide-react";

import { loginApi, registerApi } from "../services/login";

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

  console.log("[AuthPage] Rendered, mode:", mode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[AuthPage] handleSubmit triggered. username:", username);
    setError("");
    setLoading(true);

    const body =
      mode === "login" ? { username, password } : { username, email, password };

    try {
      const data =
        mode === "login" ? await loginApi(body) : await registerApi(body);

      console.log("[AuthPage] Authentication successful. Response data:", data);

      localStorage.setItem("jwt_token", data.token);
      localStorage.setItem("user_role", data.role);
      localStorage.setItem("username", data.username);

      console.log(
        "[AuthPage] Stored token in localStorage:",
        localStorage.getItem("jwt_token"),
      );

      onSuccess();
    } catch (err: any) {
      setError(
        err.message ||
          "Connection to server refused. Make sure backend is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        {/* Title */}
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-400">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-wide text-white">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-xs text-slate-500">
            {mode === "login" ?
              "Sign in to access your offline-first English cards"
            : "Start mastering vocabulary spaced repetition"}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
            <ShieldAlert className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Username
            </label>
            <div className="relative">
              <User className="absolute top-3 left-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Type your username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="border-slate-850 w-full rounded-xl border bg-slate-950 py-2.5 pr-4 pl-10 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {mode === "register" && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute top-3 left-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-slate-850 w-full rounded-xl border bg-slate-950 py-2.5 pr-4 pl-10 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute top-3 left-3 h-4 w-4 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-slate-850 w-full rounded-xl border bg-slate-950 py-2.5 pr-4 pl-10 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/10 transition-colors hover:bg-indigo-500 disabled:bg-indigo-800"
          >
            {loading ?
              "Processing..."
            : mode === "login" ?
              "Sign In"
            : "Sign Up"}
          </button>
        </form>

        {/* Toggle */}
        <div className="pt-2 text-center">
          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
          >
            {mode === "login" ?
              "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
