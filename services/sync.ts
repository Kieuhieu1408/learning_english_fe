import { apiFetch, BASE_URL } from "./config";

export async function fetchRemoteCountersApi(): Promise<any> {
  const res = await apiFetch(`${BASE_URL}/api/sync/counters`);
  if (!res.ok) throw new Error("Failed to fetch remote counters");
  return res.json();
}

export interface BatchSyncRequest {
  topics: any[];
  notes: any[];
  words: any[];
  deletedTopicIds: string[];
  deletedNoteIds: string[];
  deletedWordIds: string[];
}

export async function triggerBatchSyncApi(
  request: BatchSyncRequest,
  idempotencyKey: string,
): Promise<any> {
  const res = await apiFetch(`${BASE_URL}/api/sync/batch`, {
    method: "POST",
    headers: {
      "X-Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Sync batch request failed: ${res.status} - ${errText}`);
  }
  return res.json();
}
