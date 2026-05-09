import type { Lead, Segment } from "./types";

/** Fallback when a tool is called without a `leads` payload — Pet-App shaped. */
export const SAMPLE_LEADS: Lead[] = [
  {
    id: "sample-croqueta",
    name: "Croqueta",
    email: "",
    role: "Pastor Belga",
    company: "3 años",
    workshop: "Última rev.: 2026-04-20",
    technical_level: "3",
    tools: ["Rabia", "Sextupla"],
    status: "Not started",
    opt_in: false,
    message: "Propenso a displasia de cadera",
  },
];

export const SAMPLE_SEGMENTS: Segment[] = [];
