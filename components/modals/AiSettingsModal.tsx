"use client";

import React, { useCallback, useEffect, useState } from "react";

import { RefreshCw, Sparkles } from "lucide-react";

import type { ModelInfo } from "~/services/ai-settings";

import { Button, Input, Modal } from "~/components/ui";
import {
  fetch9RouterModels,
  fetchAiSettingsApi,
  saveAiSettingsApi,
  testAiConnectionApi,
} from "~/services/ai-settings";

const PROVIDER_PRESETS: Record<string, { id: string; name: string }[]> = {
  DEEPSEEK: [
    { id: "deepseek-chat", name: "DeepSeek Chat (V3)" },
    { id: "deepseek-reasoner", name: "DeepSeek Reasoner (R1)" },
  ],
  GEMINI: [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
  ],
  OPENAI: [
    { id: "gpt-4o-mini", name: "GPT-4o Mini" },
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "o3-mini", name: "o3-mini" },
  ],
  ANTHROPIC: [
    { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet" },
    { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku" },
  ],
};

export function AiSettingsModal({
  isOpen,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [provider, setProvider] = useState("9ROUTER");
  const [apiKey, setApiKey] = useState("");
  const [apiKeyHint, setApiKeyHint] = useState<string | null>(null);
  const [modelName, setModelName] = useState("deepseek-chat");
  const [baseUrl, setBaseUrl] = useState("http://localhost:20128/v1");
  const [showKey, setShowKey] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [routerModels, setRouterModels] = useState<ModelInfo[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [modelFetchError, setModelFetchError] = useState<string | null>(null);

  const loadModels = useCallback(
    async (targetBaseUrl: string, targetKey?: string) => {
      setLoadingModels(true);
      setModelFetchError(null);
      try {
        const fetched = await fetch9RouterModels(targetBaseUrl, targetKey);
        if (fetched.length > 0) {
          setRouterModels(fetched);
        } else {
          setModelFetchError("No models found from 9Router gateway");
        }
      } catch (err: any) {
        setModelFetchError(err.message || "Failed to fetch models");
      } finally {
        setLoadingModels(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (isOpen) {
      setTestResult(null);
      setIsCustomModel(false);
      fetchAiSettingsApi()
        .then((settings) => {
          if (settings) {
            const currentProvider = settings.provider || "9ROUTER";
            setProvider(currentProvider);
            const currentModel =
              settings.chatModel ||
              settings.translationModel ||
              settings.modelName ||
              "deepseek-chat";
            setModelName(currentModel);
            const currentBase =
              settings.customBaseUrl ||
              settings.baseUrl ||
              (currentProvider === "9ROUTER" ?
                "http://localhost:20128/v1"
              : "");
            setBaseUrl(currentBase);
            if (settings.apiKeyHint) {
              setApiKeyHint(settings.apiKeyHint);
            }
            if (currentProvider === "9ROUTER") {
              loadModels(currentBase);
            }
          } else {
            loadModels("http://localhost:20128/v1");
          }
        })
        .catch(() => {
          loadModels("http://localhost:20128/v1");
        });
    }
  }, [isOpen, loadModels]);

  if (!isOpen) return null;

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    setTestResult(null);
    setIsCustomModel(false);
    if (newProvider === "9ROUTER") {
      const defaultUrl =
        baseUrl.includes("localhost") || !baseUrl ?
          "http://localhost:20128/v1"
        : baseUrl;
      setBaseUrl(defaultUrl);
      loadModels(defaultUrl, apiKey);
    } else if (newProvider === "DEEPSEEK") {
      setBaseUrl("https://api.deepseek.com");
      setModelName("deepseek-chat");
    } else if (newProvider === "GEMINI") {
      setBaseUrl("https://generativelanguage.googleapis.com");
      setModelName("gemini-2.5-flash");
    } else if (newProvider === "OPENAI") {
      setBaseUrl("https://api.openai.com/v1");
      setModelName("gpt-4o-mini");
    } else if (newProvider === "ANTHROPIC") {
      setBaseUrl("https://api.anthropic.com");
      setModelName("claude-3-5-sonnet-20241022");
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult("Testing connection…");
    try {
      const res = await testAiConnectionApi({
        provider,
        apiKey: apiKey.trim() || undefined,
        modelName,
        chatModel: modelName,
        translationModel: modelName,
        customBaseUrl: baseUrl.trim() || undefined,
        baseUrl: baseUrl.trim() || undefined,
      });
      setTestResult(res.message || "Connection successful!");
      if (res.models && res.models.length > 0) {
        setRouterModels(res.models);
      }
    } catch (err: any) {
      setTestResult(err.message || "Connection test failed.");
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveAiSettingsApi({
        provider,
        apiKey: apiKey.trim() || undefined,
        modelName,
        chatModel: modelName,
        translationModel: modelName,
        quizModel: modelName,
        customBaseUrl: baseUrl.trim() || undefined,
        baseUrl: baseUrl.trim() || undefined,
      });
      onSaved?.();
      onClose();
    } catch (err: any) {
      setTestResult(err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="AI Settings" close={onClose}>
      <div className="space-y-4">
        <p className="modal-description text-sm text-[var(--muted)]">
          Configure an AI provider for definitions, translations, and chat.
        </p>

        <label className="block text-xs font-medium text-[var(--muted)]">
          Provider
          <select
            className="mt-1 w-full"
            value={provider}
            onChange={(e) => handleProviderChange(e.target.value)}
          >
            <option value="9ROUTER">9Router (Local Gateway)</option>
            <option value="DEEPSEEK">DeepSeek</option>
            <option value="GEMINI">Google Gemini</option>
            <option value="OPENAI">OpenAI</option>
            <option value="ANTHROPIC">Anthropic Claude</option>
          </select>
        </label>

        <label className="block text-xs font-medium text-[var(--muted)]">
          API Key {apiKeyHint && !apiKey ? `(Current: ${apiKeyHint})` : ""}
          <div className="password-input mt-1">
            <Input
              type={showKey ? "text" : "password"}
              placeholder={
                provider === "9ROUTER" ?
                  "Optional for local 9Router"
                : "Paste your API key here"
              }
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <Button
              className="quiet"
              type="button"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? "Hide" : "Show"}
            </Button>
          </div>
        </label>

        <div className="form-two">
          <div className="block min-w-0 flex-1 text-xs font-medium text-[var(--muted)]">
            <div className="mb-1 flex min-h-[20px] items-center justify-between gap-2">
              <span className="shrink-0">Model name</span>
              {provider === "9ROUTER" && (
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-[11px] text-[var(--iris)] hover:underline"
                    onClick={() => loadModels(baseUrl, apiKey)}
                    disabled={loadingModels}
                    title="Refresh model list from 9Router"
                  >
                    <RefreshCw
                      size={11}
                      className={loadingModels ? "animate-spin" : ""}
                    />
                    {loadingModels ? "Loading…" : "Refresh"}
                  </button>
                  <button
                    type="button"
                    className="text-[11px] text-[var(--muted)] hover:underline"
                    onClick={() => setIsCustomModel(!isCustomModel)}
                  >
                    {isCustomModel ? "Select from list" : "Enter custom"}
                  </button>
                </div>
              )}
            </div>

            {provider === "9ROUTER" ?
              isCustomModel ?
                <Input
                  className="mt-1"
                  value={modelName}
                  placeholder="e.g. ag/gemini-3.8-flash-high"
                  onChange={(e) => setModelName(e.target.value)}
                />
              : loadingModels && routerModels.length === 0 ?
                <select className="mt-1 w-full" disabled>
                  <option>Loading models from 9Router…</option>
                </select>
              : routerModels.length > 0 ?
                <select
                  className="mt-1 w-full"
                  value={modelName}
                  onChange={(e) => {
                    if (e.target.value === "__custom__") {
                      setIsCustomModel(true);
                    } else {
                      setModelName(e.target.value);
                    }
                  }}
                >
                  {/* Keep current model if not in the list */}
                  {modelName &&
                    !routerModels.some((m) => m.id === modelName) && (
                      <option value={modelName}>{modelName} (current)</option>
                    )}
                  {routerModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name && m.name !== m.id ? `${m.name} (${m.id})` : m.id}
                    </option>
                  ))}
                  <option value="__custom__">
                    -- Enter custom model name --
                  </option>
                </select>
              : <div className="space-y-1">
                  <Input
                    className="mt-1"
                    value={modelName}
                    placeholder="e.g. deepseek-chat"
                    onChange={(e) => setModelName(e.target.value)}
                  />
                  {modelFetchError && (
                    <span className="block text-[10px] text-amber-600 dark:text-amber-400">
                      {modelFetchError}
                    </span>
                  )}
                </div>

            : PROVIDER_PRESETS[provider] ?
              isCustomModel ?
                <Input
                  className="mt-1"
                  value={modelName}
                  placeholder="Model name"
                  onChange={(e) => setModelName(e.target.value)}
                />
              : <select
                  className="mt-1 w-full"
                  value={modelName}
                  onChange={(e) => {
                    if (e.target.value === "__custom__") {
                      setIsCustomModel(true);
                    } else {
                      setModelName(e.target.value);
                    }
                  }}
                >
                  {modelName &&
                    !PROVIDER_PRESETS[provider].some(
                      (m) => m.id === modelName,
                    ) && (
                      <option value={modelName}>{modelName} (current)</option>
                    )}
                  {PROVIDER_PRESETS[provider].map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                  <option value="__custom__">
                    -- Enter custom model name --
                  </option>
                </select>

            : <Input
                className="mt-1"
                value={modelName}
                placeholder="Model name"
                onChange={(e) => setModelName(e.target.value)}
              />
            }
          </div>

          <label className="block min-w-0 flex-1 text-xs font-medium text-[var(--muted)]">
            <div className="mb-1 flex min-h-[20px] items-center">
              <span>Custom Base URL (optional)</span>
            </div>
            <Input
              className="mt-1"
              value={baseUrl}
              placeholder="https://api.example.com"
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </label>
        </div>

        <small className="muted block text-[11px] text-[var(--muted)]">
          Keys are encrypted with AES-256 on the backend, or stored locally when
          offline.
        </small>

        <div className="modal-actions flex items-center justify-between gap-3 pt-2">
          <Button type="button" disabled={testing} onClick={handleTest}>
            <Sparkles size={14} />
            {testing ? "Testing…" : "Test connection"}
          </Button>

          <Button
            className="primary"
            type="button"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? "Saving…" : "Save preferences"}
          </Button>
        </div>

        {testResult && (
          <p
            role="status"
            className={`test-result rounded p-2 text-xs ${
              testResult.includes("success") || testResult.includes("passed") ?
                "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"
              : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
            }`}
          >
            {testResult}
          </p>
        )}
      </div>
    </Modal>
  );
}
