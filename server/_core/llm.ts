// ─── LLM Helper — OpenAI GPT-4o ──────────────────────────────────────────────
import OpenAI from "openai";
import { ENV } from "./env";

let _client: OpenAI | null = null;
function getClient() {
  if (!_client) _client = new OpenAI({ apiKey: ENV.openaiApiKey });
  return _client;
}

export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function invokeLLM({
  messages,
  response_format,
}: {
  messages: Message[];
  response_format?: object;
}) {
  const client = getClient();
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages,
    ...(response_format ? { response_format } : {}),
  } as Parameters<typeof client.chat.completions.create>[0]);
  return response;
}
