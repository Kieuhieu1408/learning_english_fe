import type { NoteOffline, TopicOffline, WordOffline } from "./db";

import { fetchRemoteCountersApi, triggerBatchSyncApi } from "../services/sync";
import { db } from "./db";

export async function fetchRemoteCounters() {
  try {
    return await fetchRemoteCountersApi();
  } catch (error) {
    console.error("Offline - using local counters:", error);
    return null;
  }
}

export async function triggerBatchSync() {
  try {
    // 1. Gather all local changes from sync queue
    const queuedItems = await db.syncQueue.toArray();

    // Map queue items to batch requests (deduplicating by ID)
    const topicsMap = new Map<string, any>();
    const notesMap = new Map<string, any>();
    const wordsMap = new Map<string, any>();

    const deletedTopicIds = new Set<string>();
    const deletedNoteIds = new Set<string>();
    const deletedWordIds = new Set<string>();

    for (const item of queuedItems) {
      if (item.action === "DELETE") {
        if (item.entityType === "topic") {
          topicsMap.delete(item.entityId);
          deletedTopicIds.add(item.entityId);
        }
        if (item.entityType === "note") {
          notesMap.delete(item.entityId);
          deletedNoteIds.add(item.entityId);
        }
        if (item.entityType === "word") {
          wordsMap.delete(item.entityId);
          deletedWordIds.add(item.entityId);
        }
      } else {
        const payload = JSON.parse(item.payload);
        if (item.entityType === "topic") {
          deletedTopicIds.delete(item.entityId);
          topicsMap.set(item.entityId, payload);
        }
        if (item.entityType === "note") {
          deletedNoteIds.delete(item.entityId);
          notesMap.set(item.entityId, payload);
        }
        if (item.entityType === "word") {
          deletedWordIds.delete(item.entityId);
          wordsMap.set(item.entityId, payload);
        }
      }
    }

    const topics = Array.from(topicsMap.values());
    const notes = Array.from(notesMap.values());
    const words = Array.from(wordsMap.values());

    const deletedTopicIdsArr = Array.from(deletedTopicIds);
    const deletedNoteIdsArr = Array.from(deletedNoteIds);
    const deletedWordIdsArr = Array.from(deletedWordIds);

    const idempotencyKey = crypto.randomUUID();

    // 2. Call batch sync API
    const syncData = await triggerBatchSyncApi(
      {
        topics,
        notes,
        words,
        deletedTopicIds: deletedTopicIdsArr,
        deletedNoteIds: deletedNoteIdsArr,
        deletedWordIds: deletedWordIdsArr,
      },
      idempotencyKey,
    );

    // 3. Clear queue and merge data back to local IndexedDB
    await db.transaction(
      "rw",
      [db.topics, db.notes, db.words, db.syncQueue, db.syncMetadata],
      async () => {
        // Clear processed sync queue items
        const processedIds = queuedItems.map((item) => item.id!);
        await db.syncQueue.bulkDelete(processedIds);

        // Merge topics
        if (syncData.topics) {
          await db.topics.clear();
          await db.topics.bulkPut(syncData.topics);
        }

        // Merge notes
        if (syncData.notes) {
          await db.notes.clear();
          await db.notes.bulkPut(syncData.notes);
        }

        // Merge words
        if (syncData.words) {
          await db.words.clear();
          await db.words.bulkPut(syncData.words);
        }

        // Update local sync metadata
        if (syncData.counters) {
          await db.syncMetadata.put({
            key: "lastSyncAt",
            value: syncData.counters.lastSyncAt || "",
          });
          await db.syncMetadata.put({
            key: "dailyWordCount",
            value: String(syncData.counters.dailyWordCount || 0),
          });
          await db.syncMetadata.put({
            key: "totalWordCount",
            value: String(syncData.counters.totalWordCount || 0),
          });
        }
      },
    );

    return { status: "SUCCESS", counters: syncData.counters };
  } catch (error) {
    console.error("Sync failed, working offline:", error);
    return { status: "OFFLINE_MODE", error };
  }
}

// Helpers to record local offline changes
export async function queueLocalChange(
  entityType: "topic" | "note" | "word",
  entityId: string,
  action: "CREATE" | "UPDATE" | "DELETE",
  payloadObj: any,
) {
  await db.syncQueue.put({
    entityType,
    entityId,
    action,
    payload: JSON.stringify(payloadObj),
    timestamp: Date.now(),
  });
}
