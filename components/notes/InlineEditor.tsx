"use client";

import React, { useImperativeHandle, useLayoutEffect, useRef } from "react";

import type { ClipboardEvent, MouseEventHandler, RefObject } from "react";

import { escapeReadingHtml, readEditorText } from "~/lib/reading";

type InlineEditorProps = {
  as?: "article" | "span" | "div";
  value: string;
  label: string;
  placeholder: string;
  className?: string;
  singleLine?: boolean;
  editorRef?: RefObject<HTMLElement | null>;
  format?: (text: string) => string;
  onChange: (text: string) => void;
  onSelection?: () => void;
  onClick?: MouseEventHandler<HTMLElement>;
  onEnter?: () => void;
  onDecorated?: () => void;
};

export function InlineEditor({
  as: Tag = "span",
  value,
  label,
  placeholder,
  className = "",
  singleLine = false,
  editorRef,
  format,
  onChange,
  onSelection,
  onClick,
  onEnter,
  onDecorated,
}: InlineEditorProps) {
  const element = useRef<HTMLElement | null>(null);
  const liveValue = useRef(value);
  const focused = useRef(false);
  const composing = useRef(false);

  const read = () => {
    const text = element.current ? readEditorText(element.current) : "";
    return singleLine ? text.replace(/\n+/g, " ") : text;
  };

  const decorate = (text: string) => {
    const node = element.current;
    if (!node) return;
    const template = document.createElement("template");
    template.innerHTML = format ? format(text) : escapeReadingHtml(text);
    const html = template.innerHTML;
    if (node.innerHTML !== html) {
      node.innerHTML = html;
      onDecorated?.();
    }
  };

  const publish = () => {
    const text = read();
    if (text !== liveValue.current) {
      liveValue.current = text;
      onChange(text);
    }
    return text;
  };

  useLayoutEffect(() => {
    // Preserve caret and native undo by not rewriting active DOM while typing
    if (value !== liveValue.current || !focused.current) {
      liveValue.current = value;
      decorate(value);
    }
  }, [value, format]);

  const paste = (event: ClipboardEvent<HTMLElement>) => {
    event.preventDefault();
    let text = event.clipboardData.getData("text/plain");
    if (singleLine) text = text.replace(/[\r\n]+/g, " ");

    if (!document.execCommand("insertText", false, text)) {
      const selection = window.getSelection();
      if (
        !selection?.rangeCount ||
        !element.current?.contains(selection.anchorNode)
      ) {
        return;
      }
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    publish();
  };

  useImperativeHandle(editorRef, () => element.current as any);

  return (
    <Tag
      ref={element as any}
      className={`inline-editor ${className}`}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      role="textbox"
      aria-label={label}
      aria-multiline={!singleLine}
      data-placeholder={placeholder}
      tabIndex={0}
      spellCheck
      onFocus={() => {
        focused.current = true;
      }}
      onInput={publish}
      onBlur={() => {
        const text = publish();
        focused.current = false;
        if (!composing.current) decorate(text);
      }}
      onCompositionStart={() => {
        composing.current = true;
      }}
      onCompositionEnd={() => {
        composing.current = false;
        const text = publish();
        if (!focused.current) decorate(text);
      }}
      onPaste={paste}
      onMouseUp={onSelection}
      onKeyUp={(event) => {
        if (
          !event.nativeEvent.isComposing &&
          event.shiftKey &&
          /^(ArrowLeft|ArrowRight|ArrowUp|ArrowDown|Home|End)$/.test(event.key)
        ) {
          onSelection?.();
        }
      }}
      onClick={onClick}
      onKeyDown={(event) => {
        if (
          singleLine &&
          event.key === "Enter" &&
          !event.nativeEvent.isComposing
        ) {
          event.preventDefault();
          onEnter?.();
        }
      }}
    />
  );
}
