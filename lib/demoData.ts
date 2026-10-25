import { db } from "./db";

export const normalize = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/^[^\p{L}]+|[^\p{L}]+$/gu, "")
    .replace(/\s+/g, " ");

/**
 * Remove any legacy mock seed data (topic-*, note-*, word-seed-*, ctx-seed-*)
 * so the frontend only uses genuine data fetched from the Backend PostgreSQL database.
 */
export async function cleanLegacyMockData() {
  try {
    const mockTopics = await db.topics
      .filter((t) => t.id.startsWith("topic-"))
      .toArray();
    for (const t of mockTopics) {
      await db.topics.delete(t.id);
    }

    const mockNotes = await db.notes
      .filter((n) => n.id.startsWith("note-"))
      .toArray();
    for (const n of mockNotes) {
      await db.notes.delete(n.id);
    }

    const mockWords = await db.words
      .filter((w) => w.id.startsWith("word-seed-"))
      .toArray();
    for (const w of mockWords) {
      await db.words.delete(w.id);
    }

    const mockContexts = await db.wordContexts
      .filter((c) => c.id.startsWith("ctx-seed-"))
      .toArray();
    for (const c of mockContexts) {
      await db.wordContexts.delete(c.id);
    }
  } catch (err) {
    console.warn("Failed to clean legacy mock data:", err);
  }
}

/**
 * No-op function to replace old seed data behavior.
 * Data is now fully loaded from Backend API / DatabaseSeeder.
 */
export async function ensureSeedData() {
  await cleanLegacyMockData();
}

export const dictionary: [string, string, string, string][] = [];
export const article = "";
