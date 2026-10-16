import type { NoteDto, NoteOffline, UpsertNoteParams } from "~/types";

import { db } from "~/lib/db";
import { queueLocalChange } from "~/lib/syncManager";

import { apiFetch, BASE_URL } from "./config";

export type { NoteOffline, UpsertNoteParams };

export async function fetchNotesApi(topicId?: string): Promise<NoteOffline[]> {
  try {
    const url =
      topicId ?
        `${BASE_URL}/api/notes?topicId=${encodeURIComponent(topicId)}`
      : `${BASE_URL}/api/notes`;
    const res = await apiFetch(url);
    if (res.ok) {
      const serverNotes = (await res.json()) as NoteDto[];
      if (Array.isArray(serverNotes) && serverNotes.length > 0) {
        await db.notes.bulkPut(
          serverNotes.map((n: NoteDto) => ({
            id: n.id,
            topicId: n.topic?.id || n.topicId || null,
            title: n.title,
            content: n.content || "",
            version: n.version || 1,
            createdAtMs:
              n.createdAt ? new Date(n.createdAt).getTime() : Date.now(),
            updatedAtMs:
              n.updatedAt ? new Date(n.updatedAt).getTime() : Date.now(),
          })),
        );
      }
    }
  } catch (err) {
    console.warn("fetchNotesApi failed, falling back to local Dexie:", err);
  }

  if (topicId) {
    return await db.notes.where("topicId").equals(topicId).toArray();
  }
  return await db.notes.toArray();
}

export async function upsertNoteApi(
  note: UpsertNoteParams,
): Promise<NoteOffline> {
  const existing = note.id ? await db.notes.get(note.id) : null;
  const noteId = note.id || crypto.randomUUID();

  const createdAtMs =
    note.createdAtMs ||
    (note.createdAt ? new Date(note.createdAt).getTime() : null) ||
    existing?.createdAtMs ||
    Date.now();

  const savedNote: NoteOffline = {
    id: noteId,
    topicId:
      note.topicId !== undefined ? note.topicId : existing?.topicId || null,
    title: note.title.trim() || "Untitled Note",
    content: note.content || "",
    version: (existing?.version || 0) + 1,
    createdAtMs,
    updatedAtMs: Date.now(),
  };

  await db.notes.put(savedNote);
  await queueLocalChange(
    "note",
    savedNote.id,
    existing ? "UPDATE" : "CREATE",
    savedNote,
  );

  try {
    const res = await apiFetch(`${BASE_URL}/api/notes`, {
      method: "POST",
      body: JSON.stringify({
        id: savedNote.id,
        topicId: savedNote.topicId,
        title: savedNote.title,
        content: savedNote.content,
      }),
    });
    if (res.ok) {
      const serverData = (await res.json()) as { id?: string };
      if (serverData?.id && serverData.id !== savedNote.id) {
        await db.notes.delete(savedNote.id);
        const alignedNote = { ...savedNote, id: serverData.id };
        await db.notes.put(alignedNote);
        return alignedNote;
      }
    }
  } catch (err) {
    console.warn("upsertNoteApi online call failed, kept in local queue:", err);
  }

  return savedNote;
}

export async function deleteNoteApi(id: string): Promise<void> {
  await db.notes.delete(id);
  // Keep wordContexts so words collected from this note don't lose context sentences!
  await queueLocalChange("note", id, "DELETE", { id });

  try {
    await apiFetch(`${BASE_URL}/api/notes/${id}`, {
      method: "DELETE",
    });
  } catch (err) {
    console.warn("deleteNoteApi online call failed, queued locally:", err);
  }
}
