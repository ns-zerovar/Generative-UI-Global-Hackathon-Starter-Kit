import React from "react";
import type { Lead } from "../lib/leads/types";
import {
  topStatus,
  topVaccine,
  vaccineCoveragePct,
  workshopClass,
} from "../lib/leads/derive";

interface FrameProps {
  leads: Lead[];
  children: React.ReactNode;
}

/**
 * Shared chrome around each pet-profile view: title, subtitle, KPI tiles.
 */
export function Frame({ leads, children }: FrameProps) {
  const cov = vaccineCoveragePct(leads);
  const vac = topVaccine(leads);
  const status = topStatus(leads);
  const withVac = leads.filter((l) => (l.tools?.length ?? 0) > 0).length;
  const subtitle = vac
    ? `${leads.length} perfiles · vacuna más registrada: ${vac}`
    : `${leads.length} perfiles · Notion (Pet-App)`;

  return (
    <div className="w-full p-4 text-neutral-900 dark:text-neutral-50">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mb-4">
          <h1 className="text-xl font-semibold">PawMind</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {subtitle}
          </p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="font-medium text-neutral-700 dark:text-neutral-200">
              {leads.length} perfiles
            </span>
            {" · "}
            Fuente: base Pet-App en Notion
          </p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric label="Total perfiles" value={String(leads.length)} />
          <Metric
            label="Cobertura vacunas"
            value={`${cov}%`}
            sub={`${withVac} de ${leads.length} con al menos una vacuna`}
            accentWidth={`${cov}%`}
          />
          <Metric
            label="Vacuna más común"
            value={vac ?? "—"}
            valueClass={
              vac
                ? `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${workshopClass("Not sure yet")}`
                : ""
            }
          />
          <Metric
            label="Estado frecuente"
            value={status ?? "—"}
            sub={status ? "campo Estado en Notion" : undefined}
          />
        </div>

        {children}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  valueClass,
  accentWidth,
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
  accentWidth?: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {label}
      </div>
      <div className="mt-1 truncate">
        {valueClass ? (
          <span className={valueClass}>{value}</span>
        ) : (
          <span className="text-lg font-semibold tabular-nums">{value}</span>
        )}
      </div>
      {sub ? (
        <div className="mt-0.5 text-[11px] tabular-nums text-neutral-500 dark:text-neutral-400">
          {sub}
        </div>
      ) : null}
      {accentWidth ? (
        <div className="mt-2 h-1 overflow-hidden rounded bg-neutral-100 dark:bg-neutral-800">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: accentWidth }}
          />
        </div>
      ) : null}
    </div>
  );
}
