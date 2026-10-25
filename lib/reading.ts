import type { WordWithContexts } from "~/types";

export type ReadingSegment = {
  text: string;
  word?: WordWithContexts;
};

const escapePattern = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const htmlEntities: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export const escapeReadingHtml = (text: string) =>
  text.replace(/[&<>"']/g, (character) => htmlEntities[character] || character);

export function readEditorText(root: Node): string {
  const blockTags = new Set(["DIV", "P", "LI"]);
  const readChildren = (parent: Node): string => {
    const children = [...parent.childNodes];
    let text = "";
    let previousBlock = false;
    children.forEach((child, index) => {
      if (child.nodeType === 3) {
        text += child.textContent || "";
        previousBlock = false;
        return;
      }
      if (child.nodeType !== 1) return;
      const element = child as Element;
      if (element.tagName === "BR") {
        if (index < children.length - 1) text += "\n";
        previousBlock = false;
        return;
      }
      const block = blockTags.has(element.tagName);
      if (block && index > 0 && (previousBlock || !text.endsWith("\n"))) {
        text += "\n";
      }
      text += readChildren(element);
      previousBlock = block;
    });
    return text;
  };
  return readChildren(root)
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ");
}

export function readingHtml(text: string, words: WordWithContexts[]): string {
  return segmentReading(text, words)
    .map((segment) =>
      segment.word ?
        `<span class="reader-saved-word saved-word" data-word-id="${segment.word.id}" title="${escapeReadingHtml(`${segment.word.text}: ${segment.word.meaning || segment.word.translation}`)}">${escapeReadingHtml(segment.text)}</span>`
      : escapeReadingHtml(segment.text),
    )
    .join("");
}

export function readingWordRange(
  root: HTMLElement,
  word: string,
): Range | null {
  const walker = root.ownerDocument.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
  );
  const nodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) nodes.push(node as Text);
  const text = nodes.map((part) => part.data).join("");
  const match = new RegExp(
    `\\b${escapePattern(word).replace(/\s+/g, "\\s+")}\\b`,
    "i",
  ).exec(text);
  if (!match) return null;
  const range = root.ownerDocument.createRange();
  const start = match.index;
  const end = start + match[0].length;
  let offset = 0;
  let foundStart = false;
  for (const part of nodes) {
    if (!foundStart && start >= offset && start < offset + part.length) {
      range.setStart(part, start - offset);
      foundStart = true;
    }
    if (foundStart && end <= offset + part.length) {
      range.setEnd(part, end - offset);
      return range;
    }
    offset += part.length;
  }
  return null;
}

export function segmentReading(
  text: string,
  words: WordWithContexts[],
): ReadingSegment[] {
  if (!words.length) return [{ text }];
  const byText = new Map(words.map((word) => [word.text.toLowerCase(), word]));
  const alternatives = [...byText.keys()]
    .sort((a, b) => b.length - a.length)
    .map((word) => escapePattern(word).replace(/\s+/g, "\\s+"));
  if (!alternatives.length) return [{ text }];
  const pattern = new RegExp(`\\b(?:${alternatives.join("|")})\\b`, "gi");
  const segments: ReadingSegment[] = [];
  let offset = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index!;
    if (start > offset) segments.push({ text: text.slice(offset, start) });
    segments.push({
      text: match[0],
      word: byText.get(match[0].toLowerCase().replace(/\s+/g, " ")),
    });
    offset = start + match[0].length;
  }
  if (offset < text.length) segments.push({ text: text.slice(offset) });
  return segments;
}

export type AnnotationAnchor = {
  id: string;
  anchorTop: number;
  height: number;
};

export function stackAnnotations(anchors: AnnotationAnchor[], gap = 10) {
  let bottom = -gap;
  return anchors.map((anchor) => {
    // If multiple words appear on the same line, anchorTop is identical.
    // The first word stays at anchorTop, while subsequent words stack below it.
    const top = Math.max(0, anchor.anchorTop, bottom + gap);
    bottom = top + anchor.height;
    return { id: anchor.id, top, height: anchor.height };
  });
}
