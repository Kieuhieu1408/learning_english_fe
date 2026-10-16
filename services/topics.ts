import type { TopicDto, TopicOffline } from "~/types";

import { db } from "~/lib/db";
import { queueLocalChange } from "~/lib/syncManager";

import { apiFetch, BASE_URL } from "./config";

export type { TopicOffline };

export async function fetchTopicsApi(): Promise<TopicOffline[]> {
  try {
    const res = await apiFetch(`${BASE_URL}/api/topics`);
    if (res.ok) {
      const serverTopics = (await res.json()) as TopicDto[];
      if (Array.isArray(serverTopics) && serverTopics.length > 0) {
        await db.topics.bulkPut(
          serverTopics.map((t: TopicDto) => ({
            id: t.id,
            name: t.name,
            createdAtMs:
              t.createdAt ? new Date(t.createdAt).getTime() : Date.now(),
            updatedAtMs:
              t.updatedAt ? new Date(t.updatedAt).getTime() : Date.now(),
          })),
        );
      }
    }
  } catch (err) {
    console.warn("fetchTopicsApi failed, falling back to local Dexie:", err);
  }
  return await db.topics.toArray();
}

export async function createTopicApi(name: string): Promise<TopicOffline> {
  const newTopic: TopicOffline = {
    id: crypto.randomUUID(),
    name: name.trim(),
    createdAtMs: Date.now(),
    updatedAtMs: Date.now(),
  };

  await db.topics.put(newTopic);
  await queueLocalChange("topic", newTopic.id, "CREATE", newTopic);

  try {
    const res = await apiFetch(`${BASE_URL}/api/topics`, {
      method: "POST",
      body: JSON.stringify({ name: newTopic.name }),
    });
    if (res.ok) {
      const data = (await res.json()) as { id?: string };
      if (data?.id && data.id !== newTopic.id) {
        await db.topics.delete(newTopic.id);
        const serverTopic = { ...newTopic, id: data.id };
        await db.topics.put(serverTopic);
        return serverTopic;
      }
    }
  } catch (err) {
    console.warn(
      "createTopicApi online call failed, kept in local queue:",
      err,
    );
  }

  return newTopic;
}

export async function updateTopicApi(id: string, name: string): Promise<void> {
  const existing = await db.topics.get(id);
  if (!existing) return;

  const updated: TopicOffline = {
    ...existing,
    name: name.trim(),
    updatedAtMs: Date.now(),
  };

  await db.topics.put(updated);
  await queueLocalChange("topic", id, "UPDATE", updated);

  try {
    await apiFetch(`${BASE_URL}/api/topics/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name: updated.name }),
    });
  } catch (err) {
    console.warn("updateTopicApi online call failed, queued locally:", err);
  }
}

export async function deleteTopicApi(id: string): Promise<void> {
  await db.topics.delete(id);
  // Also un-assign or delete notes in this topic
  const notesInTopic = await db.notes.where("topicId").equals(id).toArray();
  for (const n of notesInTopic) {
    await db.notes.update(n.id, { topicId: null });
  }

  await queueLocalChange("topic", id, "DELETE", { id });

  try {
    await apiFetch(`${BASE_URL}/api/topics/${id}`, {
      method: "DELETE",
    });
  } catch (err) {
    console.warn("deleteTopicApi online call failed, queued locally:", err);
  }
}
