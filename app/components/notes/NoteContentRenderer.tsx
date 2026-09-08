"use client";

import {
  MarkdownRenderer,
  MarkdownRendererProps,
} from "@/app/components/ui/MarkdownRenderer";

export type NoteContentRendererProps = MarkdownRendererProps;

/**
 * Renders rich note content with full native Markdown support,
 * interactive code blocks, local file links, and image zoom modal.
 */
export function NoteContentRenderer({
  content,
  className = "",
  maxTextLines,
}: NoteContentRendererProps) {
  return (
    <MarkdownRenderer
      content={content}
      className={className}
      maxTextLines={maxTextLines}
    />
  );
}
