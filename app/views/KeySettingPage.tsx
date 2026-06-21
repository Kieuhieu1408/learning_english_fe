'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Key,
  Sparkles,
  Check,
  X,
  Eye,
  EyeOff,
  RefreshCw,
  Cpu,
  Zap,
  ChevronDown,
  Save,
  ShieldCheck,
} from 'lucide-react';
import {
  type ModelInfo,
  testDeepSeekKey,
  testGeminiKey,
  saveAiSettings,
  fetchAiSettings,
} from '../../services/user';
import { clearAiCache } from '../../lib/aiClient';

interface KeySettingPageProps {
  onBack: () => void;
}

type Provider = 'deepseek' | 'google';

export default function KeySettingPage({ onBack }: KeySettingPageProps) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testError, setTestError] = useState('');
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [translationModel, setTranslationModel] = useState('');
  const [quizModel, setQuizModel] = useState('');
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
        setTestResult('success');
      }
    })();
  }, []);

  const handleTestConnection = async () => {
    if (!provider || !apiKey.trim()) return;
    setTesting(true);
    setTestResult(null);
    setTestError('');

    try {
      const fetchedModels =
        provider === 'deepseek'
          ? await testDeepSeekKey(apiKey)
          : await testGeminiKey(apiKey);

      setModels(fetchedModels);
      setTestResult('success');

      // Auto-select first model if not already set
      if (!translationModel && fetchedModels.length > 0) {
        setTranslationModel(fetchedModels[0]!.id);
      }
      if (!quizModel && fetchedModels.length > 0) {
        setQuizModel(fetchedModels[0]!.id);
      }
    } catch (err: any) {
      setTestResult('error');
      setTestError(err.message || 'Connection test failed');
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
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const canSave = provider && apiKey && translationModel && quizModel && testResult === 'success';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 transition-all text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI Configuration
            </h1>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Configure your AI provider and models for translation & quizzes
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Section 1: Provider Selection */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/10 rounded-lg">
              <Zap className="w-4 h-4 text-indigo-400" />
            </div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Select Provider
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* DeepSeek Card */}
            <button
              onClick={() => {
                setProvider('deepseek');
                setTestResult(null);
                setModels([]);
              }}
              className={`relative p-5 rounded-2xl border-2 transition-all duration-300 text-left group ${
                provider === 'deepseek'
                  ? 'border-cyan-500/60 bg-cyan-950/20 shadow-lg shadow-cyan-500/10'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              {provider === 'deepseek' && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    provider === 'deepseek'
                      ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                      : 'bg-slate-800 group-hover:bg-slate-700'
                  } transition-all`}
                >
                  <Cpu
                    className={`w-5 h-5 ${
                      provider === 'deepseek' ? 'text-white' : 'text-slate-400'
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
              <p className="text-xs text-slate-400 leading-relaxed">
                High-performance language models with OpenAI-compatible endpoints.
                Cost-effective for translation and generation tasks.
              </p>
            </button>

            {/* Google Gemini Card */}
            <button
              onClick={() => {
                setProvider('google');
                setTestResult(null);
                setModels([]);
              }}
              className={`relative p-5 rounded-2xl border-2 transition-all duration-300 text-left group ${
                provider === 'google'
                  ? 'border-purple-500/60 bg-purple-950/20 shadow-lg shadow-purple-500/10'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              {provider === 'google' && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    provider === 'google'
                      ? 'bg-gradient-to-br from-purple-500 to-pink-600'
                      : 'bg-slate-800 group-hover:bg-slate-700'
                  } transition-all`}
                >
                  <Sparkles
                    className={`w-5 h-5 ${
                      provider === 'google' ? 'text-white' : 'text-slate-400'
                    }`}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Google Gemini</h3>
                  <p className="text-[10px] text-slate-500">Google AI Studio</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Google's multimodal AI models. Excellent for multilingual
                translation and contextual understanding.
              </p>
            </button>
          </div>
        </section>

        {/* Section 2: API Key Input */}
        {provider && (
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-500/10 rounded-lg">
                <Key className="w-4 h-4 text-amber-400" />
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                API Key
              </h2>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {provider === 'deepseek' ? 'DeepSeek' : 'Google Gemini'} API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    placeholder="Enter your API key..."
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setTestResult(null);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleTestConnection}
                  disabled={!apiKey.trim() || testing}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-xl text-xs font-semibold text-white transition-all shadow-lg shadow-indigo-600/10 disabled:shadow-none"
                >
                  {testing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  {testing ? 'Testing...' : 'Test Connection'}
                </button>

                {testResult === 'success' && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-xl font-medium animate-in fade-in duration-200">
                    <Check className="w-3.5 h-3.5" />
                    Connected successfully!
                  </div>
                )}

                {testResult === 'error' && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 px-3 py-2 rounded-xl font-medium animate-in fade-in duration-200">
                    <X className="w-3.5 h-3.5" />
                    {testError}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Section 3: Model Selection */}
        {testResult === 'success' && models.length > 0 && (
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                <Cpu className="w-4 h-4 text-emerald-400" />
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Model Selection
              </h2>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
              {/* Translation Model */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Model for word translation
                </label>
                <div className="relative">
                  <select
                    value={translationModel}
                    onChange={(e) => setTranslationModel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
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
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* Quiz Model */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Model for quiz generation & grading
                </label>
                <div className="relative">
                  <select
                    value={quizModel}
                    onChange={(e) => setQuizModel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
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
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
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
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-800 disabled:to-slate-800 rounded-2xl text-sm font-bold text-white transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : saveSuccess ? (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Settings Saved Successfully!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Configuration
                </>
              )}
            </button>
          </div>
        )}

        {/* Bottom spacing */}
        <div className="h-8" />
      </div>
    </div>
  );
}
