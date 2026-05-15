// ─── Image Generation Helper — OpenAI DALL-E 3 ───────────────────────────────
import OpenAI from "openai";
import { ENV } from "./env";

let _client: OpenAI | null = null;
function getClient() {
  if (!_client) _client = new OpenAI({ apiKey: ENV.openaiApiKey });
  return _client;
}

export async function generateImage({ prompt }: { prompt: string }): Promise<{ url: string }> {
  const client = getClient();
  const response = await client.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1024x1024",
    quality: "hd",
  });
  const url = response.data[0]?.url;
  if (!url) throw new Error("Image generation returned no URL");
  return { url };
}
