import { useWidget, type WidgetMetadata } from "mcp-use/react";
import React, { useState } from "react";
import { z } from "zod";

export const propSchema = z.object({
  prompt: z.string().describe("Prompt completo para el modelo de imagen."),
  imageUrl: z.string().optional().describe("URL temporal si DALL-E generó la imagen."),
  petName: z.string().optional(),
  breed: z.string().optional(),
  referenceNote: z.string().optional(),
  generationError: z.string().optional(),
  assetsBaseUrl: z.string().optional().describe("Base del MCP para texturas en /pet-reference/."),
});

export type PetPortraitWidgetProps = z.infer<typeof propSchema>;

export const widgetMetadata: WidgetMetadata = {
  description:
    "Retrato generado o prompt listo; referencias UV opcionales en /pet-reference/.",
  props: propSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: false,
    invoking: "Preparando retrato…",
    invoked: "Retrato listo",
  },
};

const REF_FILES = ["diffuse.png", "bump.png", "reference-diffuse.png", "reference-bump.png"];

const PetPortraitWidget: React.FC = () => {
  const { props } = useWidget<PetPortraitWidgetProps>();
  const base =
    props?.assetsBaseUrl?.replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "");

  const [imgErr, setImgErr] = useState<Record<string, boolean>>({});

  return (
    <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-4 text-neutral-900 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50">
      <header className="mb-3">
        <h2 className="text-lg font-semibold">Retrato PawMind</h2>
        {(props?.petName || props?.breed) ? (
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {[props?.petName, props?.breed].filter(Boolean).join(" · ")}
          </p>
        ) : null}
      </header>

      {props?.imageUrl ? (
        <div className="mb-4 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
          <img
            src={props.imageUrl}
            alt="Retrato generado"
            className="h-auto w-full object-cover"
          />
        </div>
      ) : props?.generationError ? (
        <p className="mb-4 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
          {props.generationError}
        </p>
      ) : (
        <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
          Sin imagen generada en servidor (configura{" "}
          <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">
            OPENAI_API_KEY
          </code>{" "}
          en el entorno del MCP). Usa el prompt abajo en otro generador.
        </p>
      )}

      <section className="mb-4">
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Prompt
        </h3>
        <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-neutral-50 p-3 text-[13px] leading-snug dark:bg-neutral-900">
          {props?.prompt ?? ""}
        </pre>
      </section>

      {props?.referenceNote ? (
        <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
          {props.referenceNote}
        </p>
      ) : null}

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Texturas UV de referencia (opcional)
        </h3>
        <p className="mb-2 text-[11px] text-neutral-500 dark:text-neutral-400">
          Coloca tus PNG en{" "}
          <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">
            apps/mcp/public/pet-reference/
          </code>{" "}
          como{" "}
          <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">
            diffuse.png
          </code>{" "}
          /{" "}
          <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">
            bump.png
          </code>
          .
        </p>
        <div className="grid grid-cols-2 gap-2">
          {REF_FILES.map((file) => {
            const src = `${base}/pet-reference/${file}`;
            if (imgErr[file]) return null;
            return (
              <img
                key={file}
                src={src}
                alt={file}
                className="max-h-32 w-full rounded-md border border-neutral-200 object-contain dark:border-neutral-700"
                onError={() => setImgErr((m) => ({ ...m, [file]: true }))}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default PetPortraitWidget;
