import { BASE_URL, apiFetch } from './config';

export interface AiSettings {
  provider: 'deepseek' | 'google';
  apiKey: string;
  translationModel: string;
  quizModel: string;
}

export interface ModelInfo {
  id: string;
  name: string;
}

export async function fetchAiSettings(): Promise<AiSettings | null> {
  try {
    const res = await apiFetch(`${BASE_URL}/api/ai-settings`);

    if (res.status === 204) return null;

    if (!res.ok) {
      if (res.status === 404) return null;
      const errText = await res.text().catch(() => '');
      throw new Error(`Failed to fetch AI settings (Status ${res.status}): ${errText}`);
    }

    return (await res.json()) as AiSettings;
  } catch (error) {
    console.error('Failed to fetch AI settings:', error);
    return null;
  }
}

export async function saveAiSettings(settings: AiSettings): Promise<AiSettings> {
  const res = await apiFetch(`${BASE_URL}/api/ai-settings`, {
    method: 'PUT',
    body: JSON.stringify(settings),
  });

  if (!res.ok) {
    const errData = (await res.json().catch(() => ({}))) as any;
    throw new Error(errData.message || 'Failed to save AI settings');
  }

  return (await res.json()) as AiSettings;
}

export async function testDeepSeekKey(apiKey: string): Promise<ModelInfo[]> {
  const res = await fetch('https://api.deepseek.com/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });

  if (!res.ok) throw new Error('Invalid DeepSeek API key');

  const data = (await res.json()) as any;
  return (data.data || []).map((m: any) => ({
    id: m.id,
    name: m.id,
  }));
}

export async function testGeminiKey(apiKey: string): Promise<ModelInfo[]> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

  if (!res.ok) throw new Error('Invalid Google Gemini API key');

  const data = (await res.json()) as any;
  return (data.models || []).map((m: any) => ({
    id: m.name.replace('models/', ''),
    name: m.displayName || m.name.replace('models/', ''),
  }));
}
