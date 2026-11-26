"use client";

import { useCallback, useEffect, useState } from "react";
import { newId } from "./ids";
import type { Op } from "./ops";
import { loadChat, saveChat } from "./storage";
import type { ChatMessage, Trip } from "./types";

type ApplyFn = (ops: Op[], label: string, tripId?: string) => { applied: number; warnings: string[] };

type SendResult = { applied: number };

/** Chat state for one trip, persisted per trip in localStorage. */
export function useChat(tripId: string | undefined, trip: Trip | undefined, applyOps: ApplyFn) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadedTripId, setLoadedTripId] = useState<string | undefined>(undefined);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastApplied, setLastApplied] = useState<SendResult | null>(null);

  useEffect(() => {
    setMessages(tripId ? loadChat(tripId) : []);
    setLoadedTripId(tripId);
    setError(null);
    setLastApplied(null);
  }, [tripId]);

  useEffect(() => {
    if (tripId && loadedTripId === tripId) saveChat(tripId, messages);
  }, [tripId, loadedTripId, messages]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending || !trip) return;

      setError(null);
      setLastApplied(null);
      const requestTripId = trip.id;
      const userMessage: ChatMessage = {
        id: newId("msg"),
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      const outgoing = [...messages, userMessage];
      setMessages(outgoing);
      setSending(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            trip,
            // The current message is sent separately; history is everything before it.
            messages: outgoing
              .slice(0, -1)
              .slice(-10)
              .map((item) => ({ role: item.role, content: item.content })),
          }),
        });

        const payload = (await response.json().catch(() => null)) as
          | {
              reply?: string;
              ops?: Op[];
              warnings?: string[];
              error?: string;
              notice?: string;
            }
          | null;

        if (!response.ok) {
          throw new Error(payload?.error || `요청이 실패했습니다 (${response.status}).`);
        }

        let applied = 0;
        const warnings = Array.isArray(payload?.warnings) ? [...payload.warnings] : [];
        if (Array.isArray(payload?.ops) && payload.ops.length > 0) {
          const result = applyOps(payload.ops, "AI 일정 변경", requestTripId);
          applied = result.applied;
          warnings.push(...result.warnings);
        }

        setMessages((current) => [
          ...current,
          {
            id: newId("msg"),
            role: "assistant",
            content: payload?.reply || "요청을 처리했어요.",
            warnings: warnings.length > 0 ? warnings : undefined,
            createdAt: new Date().toISOString(),
          },
        ]);
        setLastApplied({ applied });
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "AI 요청 중 문제가 생겼습니다.");
      } finally {
        setSending(false);
      }
    },
    [applyOps, messages, sending, trip],
  );

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
    setLastApplied(null);
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  return { messages, sending, error, lastApplied, send, clear, dismissError };
}
