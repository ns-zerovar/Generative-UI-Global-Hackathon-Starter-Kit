"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

export type BodyMarker = {
  body_part: string;
  condition: string;
  severity: string;
  status: string;
  color: string;
  date?: string;
  notes?: string;
};

const LOCATIONS: Record<string, { x: number; y: number }> = {
  general: { x: 50, y: 46 },
  head: { x: 50, y: 12 },
  neck: { x: 50, y: 22 },
  chest: { x: 50, y: 36 },
  abdomen: { x: 50, y: 50 },
  spine: { x: 50, y: 38 },
  skin: { x: 62, y: 30 },
  hip: { x: 50, y: 58 },
  tail: { x: 50, y: 86 },
  left_front_paw: { x: 36, y: 64 },
  right_front_paw: { x: 64, y: 64 },
  left_hind_leg: { x: 43, y: 76 },
  right_hind_leg: { x: 57, y: 76 },
  left_knee: { x: 43, y: 70 },
  right_knee: { x: 57, y: 70 },
};

function locate(part: string): { x: number; y: number } {
  const key = part.toLowerCase().replace(/\s+/g, "_");
  if (LOCATIONS[key]) return LOCATIONS[key];
  for (const [k, v] of Object.entries(LOCATIONS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return LOCATIONS.general;
}

function dotColor(c: string) {
  switch (c) {
    case "red":
      return "bg-red-500 ring-red-200";
    case "orange":
      return "bg-orange-400 ring-orange-200";
    case "yellow":
      return "bg-amber-300 ring-amber-100";
    case "green":
      return "bg-emerald-500 ring-emerald-200";
    default:
      return "bg-slate-400 ring-slate-200";
  }
}

export function DogBodyMap({ markers }: { markers: BodyMarker[] }) {
  const [sel, setSel] = useState<BodyMarker | null>(null);
  const positioned = useMemo(
    () =>
      markers.map((m, i) => ({
        ...m,
        pos: locate(m.body_part),
        key: `${m.body_part}-${i}`,
      })),
    [markers],
  );

  return (
    <div className="relative grid gap-4 lg:grid-cols-[1fr_280px]">
      <motion.div
        layout
        className="relative mx-auto aspect-[3/4] w-full max-w-sm rounded-3xl bg-white/90 p-6 shadow-xl ring-1 ring-white/60 backdrop-blur"
      >
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-pm-muted">
          Interactive body map
        </p>
        <svg viewBox="0 0 100 100" className="h-auto w-full drop-shadow-sm">
          <defs>
            <linearGradient id="fur" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#dbeafe" />
              <stop offset="100%" stopColor="#bae6fd" />
            </linearGradient>
          </defs>
          {/* Stylized dog silhouette */}
          <ellipse cx="50" cy="14" rx="12" ry="10" fill="url(#fur)" stroke="#4a90d9" strokeWidth="0.8" />
          <ellipse cx="38" cy="10" rx="4" ry="5" fill="#dbeafe" stroke="#4a90d9" strokeWidth="0.6" />
          <ellipse cx="62" cy="10" rx="4" ry="5" fill="#dbeafe" stroke="#4a90d9" strokeWidth="0.6" />
          <path
            d="M50 22 Q42 28 40 38 L38 52 Q37 62 42 72 Q46 82 50 88 Q54 82 58 72 Q63 62 62 52 L60 38 Q58 28 50 22Z"
            fill="url(#fur)"
            stroke="#4a90d9"
            strokeWidth="0.9"
          />
          <path d="M38 52 Q34 58 32 68 Q36 72 40 70Z" fill="#dbeafe" stroke="#4a90d9" strokeWidth="0.6" />
          <path d="M62 52 Q66 58 68 68 Q64 72 60 70Z" fill="#dbeafe" stroke="#4a90d9" strokeWidth="0.6" />
          {positioned.map((m) => (
            <motion.g key={m.key} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
              <circle
                cx={m.pos.x}
                cy={m.pos.y}
                r="3.5"
                className="cursor-pointer"
                fill="transparent"
                onClick={() => setSel(m)}
              />
            </motion.g>
          ))}
        </svg>

        {positioned.map((m) => (
          <motion.button
            key={`hit-${m.key}`}
            type="button"
            aria-label={m.condition || m.body_part}
            className={`absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-md ring-2 ${dotColor(m.color)}`}
            style={{ left: `${m.pos.x}%`, top: `${m.pos.y}%` }}
            whileHover={{ scale: 1.15 }}
            onClick={() => setSel(m)}
          />
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {sel ? (
          <motion.div
            key={sel.body_part}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl bg-white/95 p-4 shadow-lg ring-1 ring-pm-gray"
          >
            <p className="text-xs font-bold uppercase text-pm-teal">{sel.body_part.replace(/_/g, " ")}</p>
            <p className="mt-1 text-lg font-semibold text-pm-text">{sel.condition || "Recorded finding"}</p>
            <dl className="mt-3 space-y-1 text-sm text-pm-muted">
              {sel.date ? (
                <div>
                  <dt className="font-medium text-pm-text/80">Date</dt>
                  <dd>{sel.date}</dd>
                </div>
              ) : null}
              <div>
                <dt className="font-medium text-pm-text/80">Severity / status</dt>
                <dd>
                  {sel.severity} · {sel.status}
                </dd>
              </div>
              {sel.notes ? (
                <div>
                  <dt className="font-medium text-pm-text/80">Notes</dt>
                  <dd className="leading-snug">{sel.notes}</dd>
                </div>
              ) : null}
            </dl>
            <button
              type="button"
              className="mt-3 text-xs text-pm-blue underline"
              onClick={() => setSel(null)}
            >
              Close
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-dashed border-pm-gray bg-white/40 p-4 text-sm text-pm-muted"
          >
            Tap a marker to see diagnosis, vet notes, and recovery context synced from Notion.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
