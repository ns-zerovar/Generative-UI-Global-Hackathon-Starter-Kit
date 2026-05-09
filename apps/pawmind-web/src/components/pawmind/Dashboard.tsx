"use client";

import type { ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, Pill, RefreshCw, Upload } from "lucide-react";
import { fetchDashboardSummary, syncNotionToQdrant, uploadClinicalDoc } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { DogBodyMap, type BodyMarker } from "./DogBodyMap";

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      layout
      className={`rounded-2xl bg-white/95 p-5 shadow-lg ring-1 ring-white/70 backdrop-blur ${className}`}
    >
      <h3 className="text-sm font-bold uppercase tracking-wide text-pm-muted">{title}</h3>
      <div className="mt-3">{children}</div>
    </motion.div>
  );
}

function rowPreview(obj: Record<string, unknown>) {
  const title =
    (obj.Name as string) ||
    (obj.name as string) ||
    (obj["Medication Name"] as string) ||
    (obj["Consultation Date"] as string) ||
    "Entry";
  const sub = Object.entries(obj)
    .filter(([k]) => !["page_id", "Name", "name"].includes(k))
    .slice(0, 2)
    .map(([, v]) => String(v ?? ""))
    .join(" · ");
  return { title: String(title), sub };
}

export function Dashboard({ markers }: { markers: BodyMarker[] }) {
  const q = useQuery({ queryKey: ["dash"], queryFn: fetchDashboardSummary, refetchInterval: 60_000 });
  const sync = useMutation({ mutationFn: syncNotionToQdrant });
  const upload = useMutation({ mutationFn: uploadClinicalDoc });

  const data = q.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-pm-text">PawMind</h1>
          <p className="text-sm text-pm-muted">Your dog&apos;s clinical memory — grounded in Notion.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            type="button"
            disabled={sync.isPending}
            onClick={() => sync.mutate()}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${sync.isPending ? "animate-spin" : ""}`} />
            Sync → Qdrant
          </Button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-pm-gray bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-pm-gray/50">
            <Upload className="h-4 w-4" />
            Upload PDF/DOCX
            <input
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload.mutate(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      {upload.isSuccess ? (
        <p className="text-xs text-emerald-700">
          Ingested — pages {String(upload.data?.pages_created ?? 0)}, vectors{" "}
          {String(upload.data?.chunks_embedded ?? 0)}
        </p>
      ) : null}
      {sync.isSuccess ? (
        <p className="text-xs text-emerald-700">Vector index updated: {JSON.stringify(sync.data?.upserted ?? {})}</p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Dog profile">
          {q.isLoading ? (
            <p className="text-sm text-pm-muted">Loading…</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {(data?.dogs ?? []).slice(0, 3).map((d: Record<string, unknown>, i: number) => {
                const { title, sub } = rowPreview(d);
                return (
                  <li key={i} className="rounded-xl bg-pm-gray/50 px-3 py-2">
                    <span className="font-semibold text-pm-text">{title}</span>
                    <div className="text-xs text-pm-muted">{sub}</div>
                  </li>
                );
              })}
              {!data?.dogs?.length ? <li className="text-pm-muted">Connect Notion Dogs database.</li> : null}
            </ul>
          )}
        </Card>

        <Card title="Health alerts">
          <ul className="list-disc space-y-1 pl-4 text-sm text-pm-muted">
            {(data?.alerts ?? []).map((a: string, i: number) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </Card>

        <Card title="Medications">
          <ul className="space-y-2">
            {(data?.medications ?? []).slice(0, 6).map((m: Record<string, unknown>, i: number) => {
              const { title, sub } = rowPreview(m);
              return (
                <li key={i} className="flex gap-2 rounded-xl bg-pm-gray/40 px-3 py-2 text-sm">
                  <Pill className="mt-0.5 h-4 w-4 shrink-0 text-pm-teal" />
                  <div>
                    <div className="font-medium text-pm-text">{title}</div>
                    <div className="text-xs text-pm-muted">{sub}</div>
                  </div>
                </li>
              );
            })}
            {!data?.medications?.length ? <li className="text-sm text-pm-muted">No medications synced.</li> : null}
          </ul>
        </Card>

        <Card title="Consultations">
          <ul className="space-y-2">
            {(data?.consultations ?? []).slice(0, 6).map((c: Record<string, unknown>, i: number) => {
              const { title, sub } = rowPreview(c);
              return (
                <li key={i} className="flex gap-2 rounded-xl bg-pm-gray/40 px-3 py-2 text-sm">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-pm-blue" />
                  <div>
                    <div className="font-medium text-pm-text">{title}</div>
                    <div className="text-xs text-pm-muted">{sub}</div>
                  </div>
                </li>
              );
            })}
            {!data?.consultations?.length ? (
              <li className="text-sm text-pm-muted">No consultations synced.</li>
            ) : null}
          </ul>
        </Card>
      </div>

      <Card title="Medical timeline (recent)">
        <div className="max-h-56 space-y-2 overflow-y-auto">
          {(data?.recent_medical ?? []).map((r: Record<string, unknown>, i: number) => {
            const { title, sub } = rowPreview(r);
            return (
              <div key={i} className="flex gap-3 border-l-2 border-pm-teal pl-3 text-sm">
                <div>
                  <div className="font-medium">{title}</div>
                  <div className="text-xs text-pm-muted">{sub}</div>
                </div>
              </div>
            );
          })}
          {!data?.recent_medical?.length ? <p className="text-sm text-pm-muted">No records yet.</p> : null}
        </div>
      </Card>

      <Card title="Body map & surgical history">
        <DogBodyMap markers={markers.length ? markers : demoMarkers} />
      </Card>
    </div>
  );
}

const demoMarkers: BodyMarker[] = [
  {
    body_part: "left_knee",
    condition: "TPLO — demo marker",
    severity: "high",
    status: "resolved",
    color: "green",
    date: "2024-06-01",
    notes: "Replace with live Notion records.",
  },
];
