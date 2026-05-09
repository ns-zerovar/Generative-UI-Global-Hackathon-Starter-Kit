"use client";

import { motion } from "framer-motion";
import { Loader2, Send } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { streamChat } from "@/lib/api";
import { useChatStore } from "@/store/chat-store";
import { Button } from "@/components/ui/button";

const SUGGESTED = [
  "When is my next consultation?",
  "What medication is my dog taking?",
  "Has this happened before?",
  "Why is he scratching himself again?",
];

export function ChatPanel() {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const turns = useChatStore((s) => s.turns);
  const streaming = useChatStore((s) => s.streaming);
  const appendUser = useChatStore((s) => s.appendUser);
  const appendAssistantChunk = useChatStore((s) => s.appendAssistantChunk);
  const finalizeAssistant = useChatStore((s) => s.finalizeAssistant);
  const resetStream = useChatStore((s) => s.resetStream);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      setBusy(true);
      resetStream();
      const prior = turns.map((t) => ({ role: t.role, content: t.content }));
      appendUser(trimmed);
      setInput("");
      try {
        await streamChat(prior, trimmed, (chunk) => {
          appendAssistantChunk(chunk);
        });
        finalizeAssistant();
      } catch {
        appendAssistantChunk("\n\n_Something went wrong — check PawMind API and OPENAI_API_KEY._");
        finalizeAssistant();
      } finally {
        setBusy(false);
        bottom.current?.scrollIntoView({ behavior: "smooth" });
      }
    },
    [appendAssistantChunk, appendUser, busy, finalizeAssistant, resetStream, turns],
  );

  return (
    <motion.section
      layout
      className="flex h-[min(720px,calc(100vh-8rem))] flex-col rounded-3xl bg-white/95 shadow-xl ring-1 ring-white/70 backdrop-blur"
    >
      <header className="border-b border-pm-gray px-5 py-4">
        <h2 className="text-lg font-semibold text-pm-text">Ask PawMind</h2>
        <p className="text-xs text-pm-muted">
          Answers use your Notion veterinary databases + vector memory. Not a substitute for a vet.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-pm-gray/80 px-4 py-3">
        {SUGGESTED.map((s) => (
          <button
            key={s}
            type="button"
            disabled={busy}
            className="rounded-full bg-pm-gray/80 px-3 py-1 text-xs font-medium text-pm-text transition hover:bg-pm-teal/20"
            onClick={() => void send(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {turns.length === 0 && !streaming ? (
          <p className="text-center text-sm text-pm-muted">
            Start with a question — PawMind will search medical records, medications, and visits.
          </p>
        ) : null}
        {turns.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
              t.role === "user"
                ? "ml-auto bg-gradient-to-br from-pm-blue to-pm-teal text-white"
                : "mr-auto bg-pm-gray/60 text-pm-text"
            }`}
          >
            <div className="whitespace-pre-wrap">{t.content}</div>
          </motion.div>
        ))}
        {streaming ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mr-auto max-w-[92%] rounded-2xl bg-pm-gray/60 px-4 py-3 text-sm text-pm-text shadow-sm"
          >
            <div className="whitespace-pre-wrap">{streaming}</div>
          </motion.div>
        ) : null}
        <div ref={bottom} />
      </div>

      <footer className="border-t border-pm-gray p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            disabled={busy}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            placeholder="Describe symptoms or ask about history..."
            rows={2}
            className="flex-1 resize-none rounded-2xl border border-pm-gray bg-white px-4 py-3 text-sm outline-none ring-pm-teal focus:ring-2"
          />
          <Button
            type="button"
            size="lg"
            className="self-end rounded-2xl px-5"
            disabled={busy || !input.trim()}
            onClick={() => void send(input)}
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
        <p className="mt-2 text-[11px] leading-snug text-pm-muted">
          PawMind is not a veterinarian. For emergencies or diagnoses, contact your clinic immediately.
        </p>
      </footer>
    </motion.section>
  );
}
