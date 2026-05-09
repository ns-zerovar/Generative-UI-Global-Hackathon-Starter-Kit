import { MCPServer, text, widget } from "mcp-use/server";
import { z } from "zod";
import {
  leadSchema,
  segmentSchema,
  type Lead,
  type Segment,
} from "./src/lib/leads/types";
import { topVaccine } from "./src/lib/leads/derive";
import { SAMPLE_LEADS, SAMPLE_SEGMENTS } from "./src/lib/leads/sample";

const server = new MCPServer({
  name: "pawmind-mcp",
  title: "pawmind-mcp",
  version: "1.0.0",
  description:
    "PawMind — widgets MCP para perfiles de mascotas (Pet-App DB / Notion): tabla de perfiles, resumen de vacunas, tablero de salud y pipeline. Sin arrays con `.default([])` en el esquema de herramientas (compatible OpenAI).",
  baseUrl: process.env.MCP_URL || "http://localhost:3011",
  favicon: "favicon.ico",
  websiteUrl: "https://mcp-use.com",
  icons: [
    {
      src: "icon.svg",
      mimeType: "image/svg+xml",
      sizes: ["512x512"],
    },
  ],
});

/**
 * Tool input schema — **never** use `z.array(...).default([])` here.
 * OpenAI's function validator rejects the resulting JSON Schema with:
 * `False is not of type 'array'`.
 */
const profilesInput = z.object({
  leads: z
    .array(leadSchema)
    .optional()
    .describe(
      "Filas de mascotas (misma forma que el agente Notion). Omite el campo para usar datos demo.",
    ),
  segments: z
    .array(segmentSchema)
    .optional()
    .describe("Segmentos opcionales para puntos de color."),
});

function pickLeads(input: { leads?: Lead[] }): Lead[] {
  const rows = input.leads;
  return rows && rows.length ? rows : SAMPLE_LEADS;
}

function pickSegments(input: { segments?: Segment[] }): Segment[] {
  const rows = input.segments;
  return rows && rows.length ? rows : SAMPLE_SEGMENTS;
}

function summarize(leads: Lead[], view: string): string {
  const vac = topVaccine(leads);
  const tail = vac ? ` Vacuna más común en datos: ${vac}.` : "";
  return `Vista «${view}»: ${leads.length} perfil(es) de mascota.${tail}`;
}

server.tool(
  {
    name: "show-pet-profile-list",
    description:
      "Muestra la tabla de perfiles de mascotas (PawMind): nombre, raza, edad, vacunas, última revisión, historial clínico.",
    schema: profilesInput,
    widget: {
      name: "lead-list",
      invoking: "Cargando perfiles…",
      invoked: "Lista lista",
    },
  },
  async (input) => {
    const leads = pickLeads(input);
    const segments = pickSegments(input);
    return widget({
      props: { leads, segments },
      output: text(summarize(leads, "lista")),
    });
  },
);

server.tool(
  {
    name: "show-vaccination-summary",
    description:
      "Gráficos de vacunas / etiquetas y uso de campos (sustituye la vista «demanda de taller» del kit anterior).",
    schema: profilesInput.pick({ leads: true }),
    widget: {
      name: "lead-demand",
      invoking: "Agregando datos…",
      invoked: "Resumen listo",
    },
  },
  async (input) => {
    const leads = pickLeads(input);
    return widget({
      props: { leads },
      output: text(summarize(leads, "vacunas")),
    });
  },
);

server.tool(
  {
    name: "show-pet-status-board",
    description:
      "Tablero tipo kanban por estado (solo lectura) para los perfiles cargados.",
    schema: profilesInput,
    widget: {
      name: "lead-pipeline",
      invoking: "Cargando tablero…",
      invoked: "Tablero listo",
    },
  },
  async (input) => {
    const leads = pickLeads(input);
    const segments = pickSegments(input);
    return widget({
      props: { leads, segments },
      output: text(summarize(leads, "tablero")),
    });
  },
);

server.tool(
  {
    name: "show-pet-health-dashboard",
    description:
      "Dashboard de salud: KPIs + donut de estado + barras (adaptado a datos de mascotas).",
    schema: profilesInput.pick({ leads: true }),
    widget: {
      name: "canvas-dashboard",
      invoking: "Agregando…",
      invoked: "Dashboard listo",
    },
  },
  async (input) => {
    const leads = pickLeads(input);
    return widget({
      props: { leads },
      output: text(summarize(leads, "dashboard")),
    });
  },
);

const SAMPLE_DRAFT = {
  leadId: "sample-croqueta",
  leadName: "Croqueta",
  leadEmail: "",
  leadCompany: "",
  leadRole: "Pastor Belga",
  subject: "Seguimiento displasia de cadera",
  body:
    "Hola,\n\nQueríamos recordarte revisar la marcha tras la última visita y mantener el peso estable.\n\nSaludos,\nEquipo PawMind",
};

server.tool(
  {
    name: "show-vet-note-draft",
    description:
      "Borrador editable de nota para el expediente (HITL). Por defecto datos demo.",
    schema: z.object({
      leadId: z
        .string()
        .optional()
        .describe("Id de página Notion del perfil."),
      leadName: z.string().optional(),
      leadEmail: z.string().optional(),
      leadCompany: z.string().optional(),
      leadRole: z.string().optional(),
      subject: z.string().optional(),
      body: z.string().optional(),
    }),
    widget: {
      name: "email-draft",
      invoking: "Preparando borrador…",
      invoked: "Borrador listo",
    },
  },
  async (input) => {
    const props = {
      ...SAMPLE_DRAFT,
      ...input,
      leadId: input.leadId ?? SAMPLE_DRAFT.leadId,
      subject: input.subject ?? SAMPLE_DRAFT.subject,
      body: input.body ?? SAMPLE_DRAFT.body,
    };
    return widget({
      props,
      output: text(
        `Borrador para ${props.leadName ?? props.leadId}: ${props.subject}`,
      ),
    });
  },
);

server.tool(
  {
    name: "post-vet-note-comment",
    description:
      "Confirma el envío del borrador (demo — conectar Notion en producción).",
    schema: z.object({
      leadId: z.string(),
      subject: z.string(),
      body: z.string(),
    }),
  },
  async ({ leadId, subject }) => {
    return text(`Nota registrada (demo) para ${leadId}: "${subject}"`);
  },
);

server.listen().then(() => {
  console.log("PawMind MCP server running on port 3011");
});
