import type { AppConfigDto } from "~/types";

import { db } from "~/lib/db";

import { apiFetch, BASE_URL } from "./config";

export type { AppConfigDto };

const LOCAL_APP_CONFIG_KEY = "margin_app_config";

export async function fetchAppConfigApi(): Promise<AppConfigDto> {
  try {
    const res = await apiFetch(`${BASE_URL}/api/v1/app-config`, {
      method: "GET",
    });
    if (res.ok && res.status !== 204) {
      const data = (await res.json()) as AppConfigDto;
      if (data) {
        try {
          await db.configs.put({
            key: LOCAL_APP_CONFIG_KEY,
            value: JSON.stringify(data),
          });
        } catch {
          /* ignore cache error */
        }
        return data;
      }
    }
  } catch {
    /* ignore fetch error */
  }

  try {
    const cached = await db.configs.get(LOCAL_APP_CONFIG_KEY);
    if (cached?.value) {
      return JSON.parse(cached.value) as AppConfigDto;
    }
  } catch {
    /* ignore cache error */
  }

  return {
    targetLanguage: "vi",
    autoTranslateSentence: true,
    theme: "light",
  };
}

export async function saveAppConfigApi(
  config: AppConfigDto,
): Promise<AppConfigDto> {
  try {
    await db.configs.put({
      key: LOCAL_APP_CONFIG_KEY,
      value: JSON.stringify(config),
    });
  } catch {
    /* ignore cache error */
  }

  try {
    const res = await apiFetch(`${BASE_URL}/api/v1/app-config`, {
      method: "PUT",
      body: JSON.stringify(config),
    });
    if (res.ok) {
      const data = (await res.json()) as AppConfigDto;
      return data;
    }
  } catch {
    /* ignore api error */
  }

  return config;
}
