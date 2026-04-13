"use client";

import { useMemo } from "react";
import { prepare, layout, prepareWithSegments, layoutWithLines, type PreparedText, type PreparedTextWithSegments } from "@chenglou/pretext";

interface TextMetrics {
  height: number;
  lineCount: number;
}

interface TextMetricsWithLines extends TextMetrics {
  lines: { text: string; width: number }[];
}

export function useTextHeight(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number,
  options?: { whiteSpace?: "normal" | "pre-wrap"; wordBreak?: "normal" | "keep-all" }
): number {
  return useMemo(() => {
    if (!text || !text.trim()) return lineHeight;
    const prepared = prepare(text, font, options);
    return layout(prepared, maxWidth, lineHeight).height;
  }, [text, font, maxWidth, lineHeight, options?.whiteSpace, options?.wordBreak]);
}

export function useTextMetrics(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number,
  options?: { whiteSpace?: "normal" | "pre-wrap"; wordBreak?: "normal" | "keep-all" }
): TextMetrics {
  return useMemo(() => {
    if (!text || !text.trim()) return { height: lineHeight, lineCount: 1 };
    const prepared = prepare(text, font, options);
    return layout(prepared, maxWidth, lineHeight);
  }, [text, font, maxWidth, lineHeight, options?.whiteSpace, options?.wordBreak]);
}

export function useTextLines(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number,
  options?: { whiteSpace?: "normal" | "pre-wrap"; wordBreak?: "normal" | "keep-all" }
): TextMetricsWithLines {
  return useMemo(() => {
    if (!text || !text.trim()) {
      return { height: lineHeight, lineCount: 1, lines: [] };
    }
    const prepared = prepareWithSegments(text, font, options);
    const result = layoutWithLines(prepared, maxWidth, lineHeight);
    return {
      height: result.height,
      lineCount: result.lineCount,
      lines: result.lines.map((l) => ({ text: l.text, width: l.width })),
    };
  }, [text, font, maxWidth, lineHeight, options?.whiteSpace, options?.wordBreak]);
}

// Pre-calculated metrics for message lists (virtualization support)
export function calculateMessageMetrics(
  content: string,
  font: string,
  maxWidth: number,
  lineHeight: number,
  padding: number = 16
): { height: number; lineCount: number } {
  if (!content || !content.trim()) {
    return { height: lineHeight + padding * 2, lineCount: 1 };
  }
  const prepared = prepare(content, font, { whiteSpace: "pre-wrap" });
  const { height, lineCount } = layout(prepared, maxWidth - padding * 2, lineHeight);
  return {
    height: height + padding * 2,
    lineCount,
  };
}
