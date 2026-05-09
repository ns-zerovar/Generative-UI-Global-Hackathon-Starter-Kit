import { z } from "zod";

/**
 * Canonical row shape for PawMind / Pet-App DB (Notion).
 * Matches the normalized `Lead` dict from `apps/agent` Notion sync.
 *
 * IMPORTANT for OpenAI tool schemas: do **not** use `.default([])` on array
 * fields — it can serialize to invalid JSON Schema (`False is not of type
 * 'array'`). Use `.optional()` and coerce with `?? []` at runtime.
 */
export const STATUSES = ["Not started", "In progress", "Done"] as const;
export type LeadStatus = (typeof STATUSES)[number];

/** Legacy workshop enum — still used by derive charts for mixed data. */
export const WORKSHOPS = [
  "Agentic UI (AG-UI)",
  "MCP Apps / Tooling",
  "RAG & Data Chat",
  "Evaluations & Guardrails",
  "Deploying Agents (prod)",
  "Not sure yet",
] as const;
export type Workshop = (typeof WORKSHOPS)[number];

export const TECH_LEVELS = [
  "Non-technical",
  "Some technical",
  "Developer",
  "Advanced / expert",
] as const;
export type TechLevel = (typeof TECH_LEVELS)[number];

export const SEGMENT_COLORS = [
  "indigo",
  "emerald",
  "amber",
  "rose",
  "sky",
  "violet",
  "slate",
] as const;
export type SegmentColor = (typeof SEGMENT_COLORS)[number];

/** One pet profile row (maps Notion: Nombre, Raza, Edad, Vacunas, Última Rev., Historial). */
export const petProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  workshop: z.string().optional(),
  technical_level: z.string().optional(),
  tools: z.array(z.string()).optional(),
  status: z.string().optional(),
  opt_in: z.boolean().optional(),
  /** Historial / clinical notes */
  message: z.string().optional(),
});

export type Lead = z.infer<typeof petProfileSchema>;

/** Alias for widgets / tools that still import `leadSchema`. */
export const leadSchema = petProfileSchema;

export const segmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.enum(SEGMENT_COLORS).optional(),
  /** No `.default([])` — OpenAI strict JSON Schema rejects it on nested arrays. */
  leadIds: z.array(z.string()).optional(),
});

export type Segment = z.infer<typeof segmentSchema>;
