// ─── Image Generation Helper — Leonardo AI ───────────────────────────────────
// Leonardo AI is an async API: you POST a generation job, then poll for the
// result. This helper wraps both steps and returns a stable URL.
//
// Docs: https://docs.leonardo.ai/reference/creategeneration
import { ENV } from "./env";

const LEONARDO_API = "https://cloud.leonardo.ai/api/rest/v1";

// ─── Technical Glossary — PT → EN translation for jewelry terms ───────────────
// Danya conducts the consultative discovery in PT-BR. When she emits the final
// briefing for the render studio, this glossary catches any PT terms that
// leaked through and normalizes them to the canonical English vocabulary
// Leonardo responds best to.
export const TECHNICAL_GLOSSARY: Record<string, string> = {
  // Lapidações
  "brilhante redondo": "round brilliant cut",
  "princesa": "princess cut",
  "esmeralda lapidação": "emerald cut",
  "oval": "oval cut",
  "gota": "pear cut",
  "pera": "pear cut",
  "navete": "marquise cut",
  "marquise": "marquise cut",
  "coração": "heart cut",
  "radiant": "radiant cut",
  "cushion antique": "antique cushion cut",
  "antique": "antique cushion cut",
  "cushion": "cushion cut",
  "asscher": "asscher cut",
  "baguete": "baguette cut",
  "trillion": "trillion cut",
  "old european": "old european cut",
  "rose cut": "rose cut",

  // Cravações
  "unha de gato tradicional": "traditional double-claw prong setting",
  "unha de gato moderna": "modern double-claw setting",
  "garras": "prong setting",
  "4 garras": "4-prong setting",
  "6 garras": "6-prong setting",
  "bezel": "bezel setting",
  "chapado": "bezel setting",
  "pavé": "pavé setting",
  "micro-pavé": "micro-pavé setting",
  "canalete": "channel setting",
  "channel": "channel setting",
  "bar setting": "bar setting",
  "tension setting": "tension setting",
  "halo": "halo setting",
  "illusion": "illusion setting",

  // Hastes
  "anatômica": "anatomic comfort fit shank",
  "comfort fit": "comfort fit shank",
  "haste clássica": "classic court shank",
  "dividida": "split shank",
  "split shank": "split shank",
  "haste dupla": "double shank",
  "infinito": "infinity shank",
  "cathedral": "cathedral shank",
  "plain band": "plain band",

  // Galerias
  "galeria aberta": "open gallery",
  "open gallery": "open gallery",
  "galeria fechada": "closed gallery",
  "filigrana": "filigree gallery",
  "vazada": "pierced gallery",

  // Acabamentos
  "polido": "high polish finish",
  "escovado": "brushed satin finish",
  "acetinado": "satin finish",
  "fosco": "matte finish",
  "martelado": "hammered finish",
  "oxidado": "oxidized finish",
  "rodínio": "rhodium plated",

  // Metais
  "ouro 18k bicolor": "18k bicolor gold (white and yellow)",
  "ouro 18k tricolor": "18k tricolor gold (white, yellow, rose)",
  "ouro branco 18k": "18k white gold",
  "ouro amarelo 18k": "18k yellow gold",
  "ouro rosé 18k": "18k rose gold",
  "ouro 18k": "18k gold",
  "platina": "platinum",
  "prata 950": "sterling silver 950",
  "paládio": "palladium",

  // Pedras
  "esmeralda colombiana": "colombian emerald",
  "esmeralda": "emerald (emerald cut)",
  "diamante": "diamond",
  "rubi": "ruby",
  "safira azul": "blue sapphire",
  "safira amarela": "yellow sapphire",
  "safira rosa": "pink sapphire",
  "safira": "sapphire",
  "água-marinha": "aquamarine",
  "aguamarinha": "aquamarine",
  "citrino": "citrine",
  "ametista": "amethyst",
  "topázio": "topaz",
  "turmalina": "tourmaline",
  "tanzanita": "tanzanite",
  "opala": "opal",
  "pérola": "pearl",
  "morganita": "morganite",
  "granada": "garnet",
};

export function translateTechTerm(ptTerm: string): string {
  const key = ptTerm.toLowerCase().trim();
  return TECHNICAL_GLOSSARY[key] ?? ptTerm;
}

// Standard suffix appended to every Leonardo prompt for consistent luxury
// jewelry product photography look.
export const LEONARDO_PROMPT_SUFFIX =
  "luxury jewelry product photography, dark gradient background, soft directional lighting from upper left, shallow depth of field, photorealistic, ultra high detail, professional studio shot, hyperrealistic materials, brand inspiration: contemporary fine jewelry, 8k quality, sharp focus on stones";

// Sort glossary keys by length (descending) so multi-word terms like
// "ouro branco 18k" match before "ouro 18k".
const GLOSSARY_KEYS_SORTED = Object.keys(TECHNICAL_GLOSSARY).sort(
  (a, b) => b.length - a.length,
);

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build the final Leonardo prompt. Translates any PT technical terms found in
 * the input to canonical EN, then ensures the standard suffix is appended.
 * Safe to call on a prompt that's already fully English — it's a no-op in
 * that case (other than appending the suffix if missing).
 */
export function buildLeonardoPrompt(rawPrompt: string): string {
  let translated = rawPrompt;
  for (const key of GLOSSARY_KEYS_SORTED) {
    const re = new RegExp(`\\b${escapeRegExp(key)}\\b`, "gi");
    translated = translated.replace(re, TECHNICAL_GLOSSARY[key]);
  }

  const normalized = translated.trim().replace(/[,\s]+$/, "");
  if (normalized.toLowerCase().includes("luxury jewelry product photography")) {
    return normalized;
  }
  return `${normalized}, ${LEONARDO_PROMPT_SUFFIX}`;
}

type CreateGenerationResponse = {
  sdGenerationJob?: {
    generationId: string;
    apiCreditCost: number;
  };
};

type GenerationResult = {
  generations_by_pk?: {
    id: string;
    status: "PENDING" | "COMPLETE" | "FAILED";
    generated_images: Array<{ id: string; url: string }>;
  };
};

async function fetchLeonardo(path: string, init?: RequestInit) {
  if (!ENV.leonardoApiKey) {
    throw new Error("LEONARDO_API_KEY is not configured");
  }
  const res = await fetch(`${LEONARDO_API}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${ENV.leonardoApiKey}`,
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Leonardo API ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

/**
 * Generate a single 1024x1024 photoreal image via Leonardo AI.
 *
 * The default model is "Leonardo Phoenix 1.0" — good for product photography.
 * Override with the LEONARDO_MODEL_ID env var.
 */
export async function generateImage({ prompt }: { prompt: string }): Promise<{ url: string }> {
  const finalPrompt = buildLeonardoPrompt(prompt);

  // ─── Step 1: create generation job ──────────────────────────────────────────
  const created = (await fetchLeonardo("/generations", {
    method: "POST",
    body: JSON.stringify({
      modelId: ENV.leonardoModelId,
      prompt: finalPrompt,
      num_images: 1,
      width: 1536,
      height: 1536,
      // Phoenix-friendly defaults: photoreal, fixed quality
      contrast: 3.5,
      styleUUID: "111dc692-d470-4eec-b791-3475abac4c46", // "Cinematic" — good for jewelry
      enhancePrompt: false,
      ultra: true,
    }),
  })) as CreateGenerationResponse;

  const generationId = created.sdGenerationJob?.generationId;
  if (!generationId) {
    throw new Error("Leonardo did not return a generation ID");
  }

  // ─── Step 2: poll until complete (max ~60s) ─────────────────────────────────
  const maxAttempts = 30;
  const delayMs = 2000;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, delayMs));
    const result = (await fetchLeonardo(`/generations/${generationId}`)) as GenerationResult;
    const job = result.generations_by_pk;
    if (!job) continue;
    if (job.status === "FAILED") {
      throw new Error(`Leonardo generation ${generationId} failed`);
    }
    if (job.status === "COMPLETE" && job.generated_images?.[0]?.url) {
      return { url: job.generated_images[0].url };
    }
  }

  throw new Error(`Leonardo generation ${generationId} timed out after ${maxAttempts * delayMs}ms`);
}
