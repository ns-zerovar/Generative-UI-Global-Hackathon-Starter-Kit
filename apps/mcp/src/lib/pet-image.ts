/**
 * Prompts + optional OpenAI image generation for pet portraits (PawMind).
 */

export type PortraitStyle =
  | "photorealistic"
  | "studio-soft-light"
  | "digital-art";

export type TexturePreset = "australian-cattle-dog-blue-heeler" | "generic";

export interface PetPortraitInput {
  name?: string;
  breed?: string;
  age?: number;
  historial?: string;
  visualStyle?: PortraitStyle;
  texturePreset?: TexturePreset;
}

const HEELER_VISUAL =
  "Australian Cattle Dog (Blue Heeler): dense blue-mottled speckled coat " +
  "(black, grey, white hairs), distinctive tan/rust markings on legs, chest, " +
  "and face; athletic build; alert expression; professional photography, " +
  "natural outdoor or studio lighting, shallow depth of field.";

function styleClause(style: PortraitStyle | undefined): string {
  switch (style) {
    case "studio-soft-light":
      return "Shot in a studio with soft diffused light, neutral backdrop, 85mm portrait lens.";
    case "digital-art":
      return "High-detail digital illustration, warm palette, clean linework suitable for a pet-care app hero image.";
    case "photorealistic":
    default:
      return "Photorealistic, sharp focus on eyes and coat texture, natural colors, no cartoon exaggeration.";
  }
}

export function buildPetPortraitPrompt(input: PetPortraitInput): string {
  const style = styleClause(input.visualStyle);
  const petLabel = [input.name, input.breed].filter(Boolean).join(", ") || "dog";
  const ageBit =
    input.age != null && !Number.isNaN(input.age)
      ? ` Age approximately ${input.age} years.`
      : "";
  const healthBit = input.historial?.trim()
    ? ` Context from owner/vet notes (subtle, not medical gore): ${input.historial.trim()}.`
    : "";

  const look =
    input.texturePreset === "australian-cattle-dog-blue-heeler"
      ? HEELER_VISUAL
      : input.breed?.trim()
        ? `Breed: ${input.breed.trim()}. Show accurate breed traits and coat.`
        : "Healthy pet dog, full body or classic portrait framing.";

  return [
    `Professional portrait of ${petLabel}.${ageBit}`,
    look,
    style,
    healthBit,
    "No text, no watermark, no collage; single clear subject.",
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function generateOpenAiPetImage(
  prompt: string,
  apiKey: string | undefined,
): Promise<{ url?: string; error?: string }> {
  if (!apiKey?.trim()) {
    return {
      error:
        "OPENAI_API_KEY no está configurada en el servidor MCP — solo se devolvió el prompt.",
    };
  }

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt.slice(0, 4000),
        n: 1,
        size: "1024x1024",
        quality: "standard",
      }),
    });

    const json = (await res.json()) as {
      data?: Array<{ url?: string }>;
      error?: { message?: string };
    };

    if (!res.ok) {
      return {
        error:
          json.error?.message ??
          `OpenAI images API HTTP ${res.status}`,
      };
    }

    const url = json.data?.[0]?.url;
    if (!url) return { error: "La API no devolvió URL de imagen." };
    return { url };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: `Fallo de red al generar imagen: ${msg}` };
  }
}
