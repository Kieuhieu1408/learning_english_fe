import { db, type TopicOffline, type NoteOffline, type WordOffline } from './db';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

export async function getAuthHeader() {
  const token = localStorage.getItem('jwt_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function fetchRemoteCounters() {
  try {
    const authHeader = await getAuthHeader();
    const res = await fetch(`${BACKEND_URL}/api/sync/counters`, {
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) throw new Error('Failed to fetch remote counters');
    return await res.json();
  } catch (error) {
    console.error('Offline - using local counters:', error);
    return null;
  }
}

export async function triggerBatchSync() {
  try {
    const authHeader = await getAuthHeader();
    
    // 1. Gather all local changes from sync queue
    const queuedItems = await db.syncQueue.toArray();
    if (queuedItems.length === 0) {
      // No changes to push, but fetch latest remote data to sync down
      const counters = await fetchRemoteCounters();
      return { status: 'NO_CHANGES', counters };
    }

    // Map queue items to batch requests
    const topics: any[] = [];
    const notes: any[] = [];
    const words: any[] = [];
    
    const deletedTopicIds: string[] = [];
    const deletedNoteIds: string[] = [];
    const deletedWordIds: string[] = [];

    for (const item of queuedItems) {
      if (item.action === 'DELETE') {
        if (item.entityType === 'topic') deletedTopicIds.push(item.entityId);
        if (item.entityType === 'note') deletedNoteIds.push(item.entityId);
        if (item.entityType === 'word') deletedWordIds.push(item.entityId);
      } else {
        const payload = JSON.parse(item.payload);
        if (item.entityType === 'topic') topics.push(payload);
        if (item.entityType === 'note') notes.push(payload);
        if (item.entityType === 'word') words.push(payload);
      }
    }

    const idempotencyKey = crypto.randomUUID();

    // 2. Call batch sync API
    const res = await fetch(`${BACKEND_URL}/api/sync/batch`, {
      method: 'POST',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        topics,
        notes,
        words,
        deletedTopicIds,
        deletedNoteIds,
        deletedWordIds,
      }),
    });

    if (!res.ok) throw new Error('Sync batch request failed');
    const syncData = await res.json();

    // 3. Clear queue and merge data back to local IndexedDB
    await db.transaction('rw', [db.topics, db.notes, db.words, db.syncQueue, db.syncMetadata], async () => {
      // Clear processed sync queue items
      const processedIds = queuedItems.map(item => item.id!);
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
        await db.syncMetadata.put({ key: 'lastSyncAt', value: syncData.counters.lastSyncAt || '' });
        await db.syncMetadata.put({ key: 'dailyWordCount', value: String(syncData.counters.dailyWordCount || 0) });
        await db.syncMetadata.put({ key: 'totalWordCount', value: String(syncData.counters.totalWordCount || 0) });
      }
    });

    return { status: 'SUCCESS', counters: syncData.counters };
  } catch (error) {
    console.error('Sync failed, working offline:', error);
    return { status: 'OFFLINE_MODE', error };
  }
}

// Helpers to record local offline changes
export async function queueLocalChange(
  entityType: 'topic' | 'note' | 'word',
  entityId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  payloadObj: any
) {
  await db.syncQueue.put({
    entityType,
    entityId,
    action,
    payload: JSON.stringify(payloadObj),
    timestamp: Date.now(),
  });
}
