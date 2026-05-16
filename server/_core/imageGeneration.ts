// ─── Image Generation Helper — Leonardo AI ───────────────────────────────────
// Leonardo AI is an async API: you POST a generation job, then poll for the
// result. This helper wraps both steps and returns a stable URL.
//
// Docs: https://docs.leonardo.ai/reference/creategeneration
import { ENV } from "./env";

const LEONARDO_API = "https://cloud.leonardo.ai/api/rest/v1";

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
  // ─── Step 1: create generation job ──────────────────────────────────────────
  const created = (await fetchLeonardo("/generations", {
    method: "POST",
    body: JSON.stringify({
      modelId: ENV.leonardoModelId,
      prompt,
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
