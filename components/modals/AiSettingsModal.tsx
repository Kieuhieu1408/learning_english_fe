"use client";

import React, { useEffect, useState } from "react";

import { Sparkles } from "lucide-react";

import { Button, Input, Modal } from "~/components/ui";
import {
  fetchAiSettingsApi,
  saveAiSettingsApi,
  testAiConnectionApi,
} from "~/services/ai-settings";

export function AiSettingsModal({
  isOpen,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [provider, setProvider] = useState("DEEPSEEK");
  const [apiKey, setApiKey] = useState("");
  const [modelName, setModelName] = useState("deepseek-chat");
  const [baseUrl, setBaseUrl] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTestResult(null);
      fetchAiSettingsApi()
        .then((settings) => {
          if (settings) {
            setProvider(settings.provider || "DEEPSEEK");
            setModelName(settings.modelName || "deepseek-chat");
            setBaseUrl(settings.baseUrl || "");
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    setTestResult(null);
    if (newProvider === "DEEPSEEK") {
      setModelName("deepseek-chat");
    } else if (newProvider === "GEMINI") {
      setModelName("gemini-2.5-flash");
    } else if (newProvider === "OPENAI") {
      setModelName("gpt-4o-mini");
    } else if (newProvider === "ANTHROPIC") {
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
        baseUrl: baseUrl.trim() || undefined,
      });
      setTestResult(res.message || "Connection successful!");
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
            <option value="DEEPSEEK">DeepSeek</option>
            <option value="GEMINI">Google Gemini</option>
            <option value="OPENAI">OpenAI</option>
            <option value="ANTHROPIC">Anthropic Claude</option>
          </select>
        </label>

        <label className="block text-xs font-medium text-[var(--muted)]">
          API Key
          <div className="password-input mt-1">
            <Input
              type={showKey ? "text" : "password"}
              placeholder="Paste your API key here"
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
          <label className="block text-xs font-medium text-[var(--muted)]">
            Model name
            <Input
              className="mt-1"
              value={modelName}
              placeholder="Model name"
              onChange={(e) => setModelName(e.target.value)}
            />
          </label>

          <label className="block text-xs font-medium text-[var(--muted)]">
            Custom Base URL (optional)
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
