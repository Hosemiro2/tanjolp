import "dotenv/config";
import { invokeLLM } from "../server/_core/llm";
import { generateImage } from "../server/_core/imageGeneration";
import { notifyOwner } from "../server/_core/notification";
import { archiveImageFromUrl } from "../server/_core/r2Storage";

type Result = { service: string; ok: boolean; detail: string };
const results: Result[] = [];

async function run(service: string, fn: () => Promise<string>): Promise<void> {
  const started = Date.now();
  try {
    const detail = await fn();
    const ms = Date.now() - started;
    results.push({ service, ok: true, detail: `OK (${ms}ms): ${detail}` });
    console.log(`[${service}] OK (${ms}ms): ${detail}`);
  } catch (err) {
    const ms = Date.now() - started;
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    results.push({ service, ok: false, detail: `FAIL (${ms}ms): ${msg}` });
    console.error(`[${service}] FAIL (${ms}ms): ${msg}`);
  }
}

await run("Anthropic", async () => {
  const res = await invokeLLM({
    messages: [{ role: "user", content: "Diga 'ok' em uma palavra" }],
    maxTokens: 20,
  });
  const text = res?.message?.content ?? "";
  if (!text || text.length === 0) throw new Error("Empty response from Anthropic");
  return `resposta: "${text.slice(0, 80)}"`;
});

await run("Leonardo", async () => {
  const res = await generateImage({ prompt: "simple red circle on white, minimal" });
  if (!res?.url) throw new Error("Leonardo did not return a URL");
  return `url: ${res.url.slice(0, 50)}...`;
});

await run("Brevo", async () => {
  const ok = await notifyOwner({
    title: "Smoke test TANJŌ",
    content: "Se chegou, Brevo está funcional. Pode deletar.",
  });
  if (!ok) throw new Error("notifyOwner returned false (Brevo not configured or send failed)");
  return "vou conferir comercial@tanjoo.com.br no meu iPhone";
});

await run("R2", async () => {
  const url = await archiveImageFromUrl("https://placehold.co/100x100.png", "smoke");
  if (!url.startsWith("https://images.tanjoo.com.br/")) {
    throw new Error(`R2 returned unexpected URL: ${url}`);
  }
  return `url: ${url}`;
});

console.log("\n─── Summary ───────────────────────────────────────────────────────────");
for (const r of results) {
  console.log(`${r.ok ? "✅" : "❌"} ${r.service}: ${r.detail}`);
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed > 0 ? 1 : 0);
