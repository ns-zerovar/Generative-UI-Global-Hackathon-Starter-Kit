import { useWidget, type WidgetMetadata } from "mcp-use/react";
import React from "react";
import { z } from "zod";
import { Frame } from "../../src/components/Frame";
import {
  leadSchema,
  segmentSchema,
  type Lead,
  type Segment,
} from "../../src/lib/leads/types";
import { segmentDotClass, statusClass } from "../../src/lib/leads/derive";
import { SAMPLE_LEADS, SAMPLE_SEGMENTS } from "../../src/lib/leads/sample";

export const propSchema = z.object({
  leads: z
    .array(leadSchema)
    .optional()
    .describe(
      "Filas de mascotas. Omite el campo para usar datos demo.",
    ),
  segments: z
    .array(segmentSchema)
    .optional()
    .describe("Segmentos opcionales para puntos de color."),
});

export type LeadListWidgetProps = z.infer<typeof propSchema>;

export const widgetMetadata: WidgetMetadata = {
  description:
    "Lista de perfiles PawMind: nombre, raza, edad, vacunas, última revisión, estado e historial.",
  props: propSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: false,
    invoking: "Cargando perfiles…",
    invoked: "Lista lista",
  },
};

const LeadListWidget: React.FC = () => {
  const { props } = useWidget<LeadListWidgetProps>();
  const leads: Lead[] = props?.leads?.length ? props.leads : SAMPLE_LEADS;
  const segments: Segment[] = props?.segments?.length
    ? props.segments
    : SAMPLE_SEGMENTS;

  return (
    <Frame leads={leads}>
      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50 text-left text-[11px] uppercase tracking-wide text-neutral-500 dark:bg-neutral-900/40 dark:text-neutral-400">
            <tr>
              <th className="px-3 py-2 font-semibold">Nombre</th>
              <th className="px-3 py-2 font-semibold">Raza</th>
              <th className="px-3 py-2 font-semibold">Edad</th>
              <th className="px-3 py-2 font-semibold">Última rev.</th>
              <th className="px-3 py-2 font-semibold">Vacunas</th>
              <th className="px-3 py-2 font-semibold">Estado</th>
              <th className="px-3 py-2 font-semibold">Historial</th>
              <th className="px-3 py-2 font-semibold">Segmentos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {leads.map((lead) => {
              const memberOf = segments.filter((s) =>
                (s.leadIds ?? []).includes(lead.id),
              );
              const tools = lead.tools ?? [];
              return (
                <tr key={lead.id}>
                  <td className="px-3 py-2 align-top font-medium">
                    {lead.name}
                    {lead.email ? (
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {lead.email}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 align-top text-neutral-600 dark:text-neutral-300">
                    {lead.role ?? "—"}
                  </td>
                  <td className="px-3 py-2 align-top text-neutral-600 dark:text-neutral-300">
                    {lead.company ?? lead.technical_level ?? "—"}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span className="text-[11px] text-neutral-600 dark:text-neutral-300">
                      {lead.workshop?.replace(/^Última rev\.:\s*/i, "") ??
                        lead.workshop ??
                        "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="flex flex-wrap gap-1">
                      {tools.slice(0, 4).map((t) => (
                        <span
                          key={t}
                          className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                        >
                          {t}
                        </span>
                      ))}
                      {tools.length > 4 ? (
                        <span className="text-[10px] text-neutral-500">
                          +{tools.length - 4}
                        </span>
                      ) : null}
                      {tools.length === 0 ? (
                        <span className="text-neutral-400">—</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${statusClass(lead.status ?? "Not started")}`}
                    >
                      {lead.status ?? "Not started"}
                    </span>
                  </td>
                  <td className="max-w-[200px] px-3 py-2 align-top text-[11px] text-neutral-600 dark:text-neutral-300">
                    <span className="line-clamp-2" title={lead.message}>
                      {lead.message ?? "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="flex gap-1">
                      {memberOf.length === 0 ? (
                        <span className="text-neutral-300 dark:text-neutral-600">
                          —
                        </span>
                      ) : (
                        memberOf.map((s) => (
                          <span
                            key={s.id}
                            title={s.name}
                            className={`size-2 rounded-full ${segmentDotClass(s.color)}`}
                          />
                        ))
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Frame>
  );
};

export default LeadListWidget;
