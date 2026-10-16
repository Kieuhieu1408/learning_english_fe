import type { BatchSyncRequest, BatchSyncResponse } from "~/types";

import { apiFetch, BASE_URL } from "./config";

export type { BatchSyncRequest, BatchSyncResponse };

export async function fetchRemoteCountersApi(): Promise<unknown> {
  const res = await apiFetch(`${BASE_URL}/api/sync/counters`);
  if (!res.ok) throw new Error("Failed to fetch remote counters");
  return res.json();
}

export async function triggerBatchSyncApi(
  request: BatchSyncRequest,
  idempotencyKey: string,
): Promise<BatchSyncResponse> {
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
  return (await res.json()) as BatchSyncResponse;
}
