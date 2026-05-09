"use client";

import { create } from "zustand";

export type ChatTurn = { role: "user" | "assistant"; content: string };

type Store = {
  turns: ChatTurn[];
  streaming: string;
  appendUser: (content: string) => void;
  appendAssistantChunk: (chunk: string) => void;
  finalizeAssistant: () => void;
  resetStream: () => void;
};

export const useChatStore = create<Store>((set, get) => ({
  turns: [],
  streaming: "",
  appendUser: (content) =>
    set((s) => ({
      turns: [...s.turns, { role: "user", content }],
      streaming: "",
    })),
  appendAssistantChunk: (chunk) =>
    set((s) => ({
      streaming: s.streaming + chunk,
    })),
  finalizeAssistant: () => {
    const { streaming, turns } = get();
    if (!streaming.trim()) return;
    set({
      turns: [...turns, { role: "assistant", content: streaming }],
      streaming: "",
    });
  },
  resetStream: () => set({ streaming: "" }),
}));
