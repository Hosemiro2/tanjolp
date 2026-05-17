import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "./env";
import { getLeadById, getChatHistory, updateLeadClassification } from "../db";

const CLASSIFIER_MODEL = "claude-haiku-4-5-20251001";

const CLASSIFIER_SYSTEM_PROMPT = `Você é um classificador de leads B2B da TANJŌ JEWELRY, uma fábrica de alta joalheria sob medida em São Paulo. Recebe a transcrição de uma conversa entre a Danya (consultora virtual da TANJŌ) e um lead. Sua tarefa é classificar o lead em UMA das 4 categorias abaixo, atribuir score 0-100 de qualificação, e listar de 3 a 5 sinais textuais que sustentam a classificação.

═══ CATEGORIAS ═══

🔥 EMPRESARIO — lojista, marca, dono(a) de loja própria ou marca de joalheria. ICP IDEAL da TANJŌ.
Sinais: "nossa coleção", "minha loja/marca", "queremos lançar", menciona volumes (10+ peças), prazos comerciais (lançamento de coleção, sazonalidade), email corporativo, empresa preenchida no formulário, pluraliza ("nossas peças").
Score base: 70-100.

🌶️ DESIGNER — designer/joalheiro profissional independente, atende cliente final mas terceiriza fabricação. Parceiro potencial.
Sinais: termos técnicos avançados sem hesitação (cravação aspargo, galeria vazada, lapidação antique), "meu cliente", "estou desenvolvendo para", linguagem artística refinada, foco em projeto autoral único.
Score base: 50-75.

❄️ ENTUSIASTA — consumidor final, comprador pessoal. Fora do ICP B2B premium.
Sinais: "minha noiva", "minha esposa", "pedido de casamento", "aniversário", "presente", primeira vez encomendando joia, foco em peça única, email gmail/hotmail, empresa vazia.
Score base: 20-45.

⚪ INDEFINIDO — sem sinais suficientes pra classificar com confiança. Conversa muito curta, evasiva, ou ambígua.
Score: 0-30.

═══ SCORE ═══

Calcule de 0-100 considerando:
- Força dos sinais (claros vs ambíguos) — peso maior
- Maturidade da conversa (quantas etapas completadas, riqueza do briefing)
- Urgência/volume mencionado (se for empresário)
- Coerência do perfil (sinais convergem ou conflitam?)

Empresário com alta urgência + volume: 85-100.
Empresário sem urgência clara: 70-80.
Designer com projeto claro: 60-75.
Entusiasta normal: 25-45.
Indefinido: 0-30.

═══ SINAIS ═══

Liste 3-5 frases curtas em português, citando trechos ou paráfrases curtas que sustentam sua classificação. Exemplos:
- "Mencionou 'nova coleção da nossa marca'"
- "Email corporativo (@empresa.com)"
- "Empresa 'X Joias' preenchida no formulário"
- "Pediu 50 peças até dezembro"
- "Usou termos técnicos como 'galeria vazada' e 'cravação aspargo'"

═══ INSTRUÇÕES ═══

Responda EXCLUSIVAMENTE invocando a tool 'classify_lead' com os 3 campos. NÃO escreva texto além da tool call.`;

const CLASSIFY_TOOL = {
  name: "classify_lead",
  description: "Classifica o lead em uma das 4 categorias com score e sinais.",
  input_schema: {
    type: "object" as const,
    properties: {
      classificacao: {
        type: "string",
        enum: ["empresario", "designer", "entusiasta", "indefinido"],
        description: "Categoria do lead.",
      },
      score: {
        type: "integer",
        minimum: 0,
        maximum: 100,
        description: "Score de qualificação 0-100.",
      },
      sinais: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 5,
        description: "Lista de 3-5 sinais textuais detectados.",
      },
    },
    required: ["classificacao", "score", "sinais"],
  },
};

export async function classifyLead(leadId: number): Promise<void> {
  try {
    const lead = await getLeadById(leadId);
    if (!lead) {
      console.warn(`[classifier] lead ${leadId} not found`);
      return;
    }
    if (lead.classificadoEm) {
      console.log(`[classifier] lead ${leadId} already classified, skipping`);
      return;
    }

    const history = await getChatHistory(leadId);
    if (history.length < 4) {
      console.log(`[classifier] lead ${leadId} has insufficient history (${history.length} msgs)`);
      return;
    }

    const transcript = history
      .map((m) => {
        const role = m.role === "user" ? "CLIENTE" : "DANYA";
        return `${role}: ${m.content}`;
      })
      .join("\n\n");

    const userContext = [
      `Lead: ${lead.nome}`,
      `Email: ${lead.email}`,
      `Empresa: ${lead.empresa || "(não preenchida)"}`,
      `WhatsApp: ${lead.whatsapp}`,
      "",
      "═══ TRANSCRIÇÃO ═══",
      "",
      transcript,
    ].join("\n");

    const client = new Anthropic({ apiKey: ENV.anthropicApiKey });

    const response = await client.messages.create({
      model: CLASSIFIER_MODEL,
      max_tokens: 1024,
      system: CLASSIFIER_SYSTEM_PROMPT,
      tools: [CLASSIFY_TOOL],
      tool_choice: { type: "tool", name: "classify_lead" },
      messages: [{ role: "user", content: userContext }],
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      console.error(`[classifier] lead ${leadId} — no tool_use block returned`);
      return;
    }

    const result = toolUse.input as {
      classificacao: "empresario" | "designer" | "entusiasta" | "indefinido";
      score: number;
      sinais: string[];
    };

    await updateLeadClassification(leadId, {
      classificacao: result.classificacao,
      score: Math.max(0, Math.min(100, result.score)),
      sinais: result.sinais.slice(0, 5),
    });

    console.log(
      `[classifier] lead ${leadId} → ${result.classificacao} (score ${result.score})`
    );
  } catch (err) {
    console.error(`[classifier] error classifying lead ${leadId}:`, err);
  }
}
