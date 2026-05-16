// ─── LLM Helper — Anthropic Claude ───────────────────────────────────────────
// Wraps the Anthropic API in a shape consumers can use without depending on
// the SDK's response types directly. The Anthropic message format separates
// the system prompt from the conversation turns, so this helper splits any
// incoming messages with role "system" into the `system` parameter.
import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "./env";

let _client: Anthropic | null = null;
function getClient() {
  if (!_client) {
    if (!ENV.anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }
    _client = new Anthropic({ apiKey: ENV.anthropicApiKey });
  }
  return _client;
}

export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LLMResponse = {
  message: { content: string };
};

/**
 * Invoke Claude with a list of messages. System-role entries are merged into
 * the `system` parameter; user/assistant entries become the conversation.
 *
 * Returns a stable shape so the caller doesn't depend on Anthropic SDK types:
 *   { message: { content: "..." } }
 */
export async function invokeLLM({
  messages,
  maxTokens = 1024,
}: {
  messages: Message[];
  maxTokens?: number;
}): Promise<LLMResponse> {
  const client = getClient();

  // Split system messages from the conversation turns.
  const systemParts = messages.filter((m) => m.role === "system").map((m) => m.content);
  const turns = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  // Claude rejects empty conversations — guard with a no-op user turn.
  if (turns.length === 0) {
    turns.push({ role: "user", content: "(início da conversa)" });
  }

  const response = await client.messages.create({
    model: ENV.anthropicModel,
    max_tokens: maxTokens,
    system: systemParts.join("\n\n") || undefined,
    messages: turns,
  });

  // Concatenate text blocks. Claude can return tool-use blocks too, but we
  // don't request tools in this app — text is the only expected block type.
  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  return { message: { content: text } };
}
