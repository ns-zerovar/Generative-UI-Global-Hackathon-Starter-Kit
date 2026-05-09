"use client";

import { useMemo } from "react";
import type { Lead } from "@/lib/leads/types";

export interface QuickStatsProps {
  leads: Lead[];
}

interface Tile {
  label: string;
  value: string;
  meta?: string;
  accent?: "lilac" | "mint" | "blue" | "orange";
}

const ACCENT: Record<NonNullable<Tile["accent"]>, string> = {
  lilac: "#BEC2FF",
  mint: "#85ECCE",
  blue: "#3D92E8",
  orange: "#FFAC4D",
};

export function QuickStats({ leads }: QuickStatsProps) {
  const tiles = useMemo<Tile[]>(() => {
    const total = leads.length;

    const vaccineTags = new Set<string>();
    for (const l of leads) {
      for (const t of l.tools ?? []) {
        if (t) vaccineTags.add(t);
      }
    }

    const withHistorial = leads.filter((l) => l.message?.trim()).length;

    let latestRev = "";
    for (const l of leads) {
      const d = l.submitted_at?.trim();
      if (d && (!latestRev || d > latestRev)) latestRev = d;
    }

    return [
      {
        label: "perfiles",
        value: total.toString(),
        meta: total === 1 ? "mascota en canvas" : "mascotas en canvas",
        accent: "lilac",
      },
      {
        label: "vacunas (tags)",
        value: vaccineTags.size.toString(),
        meta: "etiquetas distintas",
        accent: "mint",
      },
      {
        label: "con historial",
        value: withHistorial.toString(),
        meta: "notas / Historial",
        accent: "blue",
      },
      {
        label: "última rev.",
        value: latestRev ? latestRev.slice(0, 10) : "—",
        meta: latestRev ? "más reciente en datos" : "sin fecha",
        accent: "orange",
      },
    ];
  }, [leads]);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <span
              className="size-2 rounded-full"
              style={{ background: ACCENT[t.accent ?? "lilac"] }}
              aria-hidden
            />
            <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              {t.label}
            </span>
          </div>
          <div className="mt-2 truncate text-2xl font-semibold leading-tight text-foreground">
            {t.value}
          </div>
          {t.meta ? (
            <div className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
              {t.meta}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
