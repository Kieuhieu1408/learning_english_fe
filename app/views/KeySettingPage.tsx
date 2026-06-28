"use client";

import React, { useEffect, useState } from "react";

import {
  ArrowLeft,
  Check,
  ChevronDown,
  Cpu,
  Eye,
  EyeOff,
  Key,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from "lucide-react";

import type { ModelInfo } from "../../services/user";

import { clearAiCache } from "../../lib/aiClient";
import {
  fetchAiSettings,
  saveAiSettings,
  testDeepSeekKey,
  testGeminiKey,
} from "../../services/user";

interface KeySettingPageProps {
  onBack: () => void;
}

type Provider = "deepseek" | "google";

export default function KeySettingPage({ onBack }: KeySettingPageProps) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(
    null,
  );
  const [testError, setTestError] = useState("");
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [translationModel, setTranslationModel] = useState("");
  const [quizModel, setQuizModel] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load existing settings on mount
  useEffect(() => {
    (async () => {
      const existing = await fetchAiSettings();
      if (existing) {
        setProvider(existing.provider);
        setApiKey(existing.apiKey);
        setTranslationModel(existing.translationModel);
        setQuizModel(existing.quizModel);
        // Auto-test to load models
        setTestResult("success");
      }
    })();
  }, []);

  const handleTestConnection = async () => {
    if (!provider || !apiKey.trim()) return;
    setTesting(true);
    setTestResult(null);
    setTestError("");

    try {
      const fetchedModels =
        provider === "deepseek" ?
          await testDeepSeekKey(apiKey)
        : await testGeminiKey(apiKey);

      setModels(fetchedModels);
      setTestResult("success");

      // Auto-select first model if not already set
      if (!translationModel && fetchedModels.length > 0) {
        setTranslationModel(fetchedModels[0]!.id);
      }
      if (!quizModel && fetchedModels.length > 0) {
        setQuizModel(fetchedModels[0]!.id);
      }
    } catch (err: any) {
      setTestResult("error");
      setTestError(err.message || "Connection test failed");
      setModels([]);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!provider || !apiKey || !translationModel || !quizModel) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      await saveAiSettings({
        provider,
        apiKey,
        translationModel,
        quizModel,
      });
      clearAiCache();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  const canSave =
    provider &&
    apiKey &&
    translationModel &&
    quizModel &&
    testResult === "success";

  return (
    <div className="min-h-screen overflow-y-auto bg-slate-950 text-slate-100">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-6 py-4">
          <button
            onClick={onBack}
            className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 transition-all hover:border-slate-700 hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-xl font-extrabold text-transparent">
              AI Configuration
            </h1>
            <p className="mt-0.5 text-[10px] text-slate-500">
              Configure your AI provider and models for translation & quizzes
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-8 px-6 py-8">
        {/* Section 1: Provider Selection */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-indigo-500/10 p-1.5">
              <Zap className="h-4 w-4 text-indigo-400" />
            </div>
            <h2 className="text-sm font-bold tracking-wider text-white uppercase">
              Select Provider
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* DeepSeek Card */}
            <button
              onClick={() => {
                setProvider("deepseek");
                setTestResult(null);
                setModels([]);
              }}
              className={`group relative rounded-2xl border-2 p-5 text-left transition-all duration-300 ${
                provider === "deepseek" ?
                  "border-cyan-500/60 bg-cyan-950/20 shadow-lg shadow-cyan-500/10"
                : "border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900"
              }`}
            >
              {provider === "deepseek" && (
                <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
              )}
              <div className="mb-3 flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    provider === "deepseek" ?
                      "bg-gradient-to-br from-cyan-500 to-blue-600"
                    : "bg-slate-800 group-hover:bg-slate-700"
                  } transition-all`}
                >
                  <Cpu
                    className={`h-5 w-5 ${
                      provider === "deepseek" ? "text-white" : "text-slate-400"
                    }`}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">DeepSeek</h3>
                  <p className="text-[10px] text-slate-500">
                    OpenAI-compatible API
                  </p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                High-performance language models with OpenAI-compatible
                endpoints. Cost-effective for translation and generation tasks.
              </p>
            </button>

            {/* Google Gemini Card */}
            <button
              onClick={() => {
                setProvider("google");
                setTestResult(null);
                setModels([]);
              }}
              className={`group relative rounded-2xl border-2 p-5 text-left transition-all duration-300 ${
                provider === "google" ?
                  "border-purple-500/60 bg-purple-950/20 shadow-lg shadow-purple-500/10"
                : "border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900"
              }`}
            >
              {provider === "google" && (
                <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-purple-500">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
              )}
              <div className="mb-3 flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    provider === "google" ?
                      "bg-gradient-to-br from-purple-500 to-pink-600"
                    : "bg-slate-800 group-hover:bg-slate-700"
                  } transition-all`}
                >
                  <Sparkles
                    className={`h-5 w-5 ${
                      provider === "google" ? "text-white" : "text-slate-400"
                    }`}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Google Gemini
                  </h3>
                  <p className="text-[10px] text-slate-500">Google AI Studio</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                Google's multimodal AI models. Excellent for multilingual
                translation and contextual understanding.
              </p>
            </button>
          </div>
        </section>

        {/* Section 2: API Key Input */}
        {provider && (
          <section className="animate-in fade-in slide-in-from-bottom-4 space-y-4 duration-300">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-amber-500/10 p-1.5">
                <Key className="h-4 w-4 text-amber-400" />
              </div>
              <h2 className="text-sm font-bold tracking-wider text-white uppercase">
                API Key
              </h2>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  {provider === "deepseek" ? "DeepSeek" : "Google Gemini"} API
                  Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    placeholder="Enter your API key..."
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setTestResult(null);
                    }}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pr-12 pl-4 text-sm text-white placeholder-slate-600 transition-colors focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-slate-500 transition-colors hover:text-slate-300"
                  >
                    {showKey ?
                      <EyeOff className="h-4 w-4" />
                    : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleTestConnection}
                  disabled={!apiKey.trim() || testing}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/10 transition-all hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none"
                >
                  {testing ?
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  : <Zap className="h-3.5 w-3.5" />}
                  {testing ? "Testing..." : "Test Connection"}
                </button>

                {testResult === "success" && (
                  <div className="animate-in fade-in flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-400 duration-200">
                    <Check className="h-3.5 w-3.5" />
                    Connected successfully!
                  </div>
                )}

                {testResult === "error" && (
                  <div className="animate-in fade-in flex items-center gap-1.5 rounded-xl bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-400 duration-200">
                    <X className="h-3.5 w-3.5" />
                    {testError}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Section 3: Model Selection */}
        {testResult === "success" && models.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-4 space-y-4 duration-300">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-emerald-500/10 p-1.5">
                <Cpu className="h-4 w-4 text-emerald-400" />
              </div>
              <h2 className="text-sm font-bold tracking-wider text-white uppercase">
                Model Selection
              </h2>
            </div>

            <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-5">
              {/* Translation Model */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Model for word translation
                </label>
                <div className="relative">
                  <select
                    value={translationModel}
                    onChange={(e) => setTranslationModel(e.target.value)}
                    className="w-full cursor-pointer appearance-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white transition-colors focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="" disabled>
                      Select translation model...
                    </option>
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                </div>
              </div>

              {/* Quiz Model */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Model for quiz generation & grading
                </label>
                <div className="relative">
                  <select
                    value={quizModel}
                    onChange={(e) => setQuizModel(e.target.value)}
                    className="w-full cursor-pointer appearance-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white transition-colors focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="" disabled>
                      Select quiz model...
                    </option>
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Section 4: Save Button */}
        {canSave && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-600/20 transition-all hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-800 disabled:to-slate-800"
            >
              {saving ?
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              : saveSuccess ?
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Settings Saved Successfully!
                </>
              : <>
                  <Save className="h-4 w-4" />
                  Save Configuration
                </>
              }
            </button>
          </div>
        )}

        {/* Bottom spacing */}
        <div className="h-8" />
      </div>
    </div>
  );
}
