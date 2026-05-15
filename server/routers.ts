import { z } from "zod";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { notifyOwner } from "./_core/notification";
import {
  createLead,
  getLeadBySessionToken,
  saveChatMessage,
  getChatHistory,
  incrementLeadImages,
} from "./db";

// ─── CNPJ Validation (server-side) ───────────────────────────────────────────
function validateCNPJ(cnpj: string): boolean {
  const raw = cnpj.replace(/[^\d]/g, "");
  if (raw.length !== 14) return false;
  if (/^(\d)\1+$/.test(raw)) return false;
  const calc = (digits: string, weights: number[]) => {
    const sum = digits.split("").reduce((acc, d, i) => acc + parseInt(d) * weights[i], 0);
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = calc(raw.slice(0, 12), w1);
  const d2 = calc(raw.slice(0, 13), w2);
  return parseInt(raw[12]) === d1 && parseInt(raw[13]) === d2;
}

// ─── Danya AI System Prompt ───────────────────────────────────────────────────
const DANYA_SYSTEM_PROMPT = `Você é a Danya AI, a Diretora Criativa Virtual da TANJŌ JEWELRY, uma fábrica premium e maison criativa especializada em alta joalheria B2B, localizada em São Paulo. Seu objetivo é atuar como uma consultora de design para lojistas, marcas e designers que desejam criar coleções exclusivas com a TANJŌ.

### Sua Personalidade e Tom de Voz
- Tom: Sofisticado, elegante, consultivo e profissional, mas acolhedor. Você fala como uma diretora de arte de uma maison de luxo.
- Linguagem: Clara, sem jargões técnicos excessivos, mas demonstrando profundo conhecimento em ourivesaria, gemologia e design 3D.
- Postura: Você não é apenas uma consultora; você é uma parceira criativa. Você guia o cliente para refinar a ideia dele.

### Seu Fluxo de Trabalho (Siga estritamente esta ordem)

**Fase 1: O Cumprimento e o Briefing**
1. Comece cumprimentando o cliente pelo nome e agradeça o interesse em desenvolver uma coleção com a TANJŌ.
2. Faça perguntas curtas e diretas para entender a joia que o cliente imaginou. Faça no máximo duas perguntas por mensagem.
3. Você precisa descobrir os seguintes elementos:
   - Qual é a peça? (Anel, colar, pulseira, brinco, etc.)
   - Qual é o metal? (Ouro amarelo 18k, ouro branco, ouro rosé, etc.)
   - Qual é a gema principal? (Diamante, esmeralda, rubi, safira, sem gema, etc.)
   - Qual é o estilo/design? (Minimalista, vintage, cravejado/pavé, orgânico, geométrico, etc.)

**Fase 2: Confirmação e Geração (Engenharia de Prompt)**
1. Quando você tiver informações suficientes (Peça, Metal, Gema e Estilo), faça um breve resumo elegante da peça que vocês desenharam juntos.
2. Em seguida, você DEVE gerar um prompt técnico em inglês para nosso estúdio de renderização.
3. O prompt DEVE ser retornado dentro de uma tag XML <image_prompt> e seguir EXATAMENTE esta estrutura:
   <image_prompt>[Descrição detalhada da joia em inglês], ultra-realistic luxury jewelry product photography, macro close-up, sharp focus on facets, brilliant sparkle, fire and scintillation visible, studio lighting setup, dark elegant background, 8k resolution, photorealistic, commercial quality.</image_prompt>
4. Diga ao cliente: "Estou enviando essas diretrizes para o nosso estúdio de renderização. Em alguns instantes, você verá os conceitos fotorrealistas da sua joia na tela."

**Fase 3: O Fechamento (Orçamento B2B)**
1. Após a geração da imagem, pergunte o que o cliente achou do conceito.
2. Informe que este é apenas o ponto de partida. A TANJŌ cuida de todo o processo: design 3D final, fundição, cravação até a entrega da coleção.
3. Convide o cliente a solicitar um orçamento oficial de fábrica: "Gostaria de encaminhar este design para a nossa equipe comercial formular um pré-orçamento de produção para a sua marca?"

### Regras Estritas
- NUNCA mencione "Leonardo.Ai", "Midjourney" ou qualquer ferramenta de IA. Diga apenas "nosso estúdio de renderização" ou "nossa tecnologia de visualização".
- NUNCA dê preços ou estimativas de valores. Apenas convide para orçamento oficial.
- O cliente é B2B (empresa, marca ou lojista). O foco é produzir "coleções" ou "peças exclusivas para a marca dele".
- Responda SEMPRE em português brasileiro.`;

// ─── Router ───────────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Leads ──────────────────────────────────────────────────────────────────
  leads: router({
    register: publicProcedure
      .input(z.object({
        nome: z.string().min(3),
        email: z.string().email(),
        whatsapp: z.string().min(10),
        cnpj: z.string().length(14),
        empresa: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Server-side CNPJ validation
        if (!validateCNPJ(input.cnpj)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "CNPJ inválido." });
        }

        const sessionToken = nanoid(32);
        const lead = await createLead({
          nome: input.nome,
          email: input.email,
          whatsapp: input.whatsapp,
          cnpj: input.cnpj,
          empresa: input.empresa,
          sessionToken,
          imagesGenerated: 0,
        });

        // Notify owner
        await notifyOwner({
          title: `Novo lead TANJŌ: ${input.nome}`,
          content: `Empresa: ${input.empresa || "—"}\nE-mail: ${input.email}\nWhatsApp: ${input.whatsapp}\nCNPJ: ${input.cnpj}`,
        }).catch(() => {}); // non-blocking

        return { sessionToken, leadId: lead?.id };
      }),

    getSession: publicProcedure
      .input(z.object({ sessionToken: z.string() }))
      .query(async ({ input }) => {
        const lead = await getLeadBySessionToken(input.sessionToken);
        if (!lead) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão inválida." });
        return {
          id: lead.id,
          nome: lead.nome,
          imagesGenerated: lead.imagesGenerated,
        };
      }),
  }),

  // ─── Danya AI ────────────────────────────────────────────────────────────────
  danya: router({
    chat: publicProcedure
      .input(z.object({
        sessionToken: z.string(),
        message: z.string().min(1).max(1000),
      }))
      .mutation(async ({ input }) => {
        const lead = await getLeadBySessionToken(input.sessionToken);
        if (!lead) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão inválida." });

        // Get chat history
        const history = await getChatHistory(lead.id);

        // Build messages for LLM
        const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
          { role: "system", content: DANYA_SYSTEM_PROMPT.replace("{nome}", lead.nome) },
          ...history.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
          { role: "user", content: input.message },
        ];

        // Call LLM
        const response = await invokeLLM({ messages });
        const rawContent = response.choices[0]?.message?.content;
        const assistantContent = typeof rawContent === "string" ? rawContent : "";

        // Save messages to DB
        await saveChatMessage({ leadId: lead.id, role: "user", content: input.message });
        await saveChatMessage({ leadId: lead.id, role: "assistant", content: assistantContent });

        // Check if image prompt was generated
        const imagePromptMatch = assistantContent.match(/<image_prompt>([\s\S]*?)<\/image_prompt>/);
        const imagePrompt = imagePromptMatch ? imagePromptMatch[1].trim() : null;

        // Clean response text (remove XML tag from displayed text)
        const displayContent = assistantContent.replace(/<image_prompt>[\s\S]*?<\/image_prompt>/g, "").trim();

        return {
          message: displayContent,
          imagePrompt,
          imagesGenerated: lead.imagesGenerated,
        };
      }),

    generateImages: publicProcedure
      .input(z.object({
        sessionToken: z.string(),
        prompt: z.string().min(10),
      }))
      .mutation(async ({ input }) => {
        const lead = await getLeadBySessionToken(input.sessionToken);
        if (!lead) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão inválida." });

        if (lead.imagesGenerated >= 3) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Limite de 3 gerações atingido. Entre em contato para orçamento.",
          });
        }

        // Generate image via built-in image generation
        const { url } = await generateImage({ prompt: input.prompt });

        // Increment counter
        await incrementLeadImages(lead.id);

        const imageUrl = url ?? "";

        // Save to chat history
        await saveChatMessage({
          leadId: lead.id,
          role: "assistant",
          content: "Aqui está o conceito fotorrealista da sua joia:",
          imageUrls: [imageUrl],
        });

        return { imageUrl: imageUrl, imagesGenerated: lead.imagesGenerated + 1 };
      }),

    getHistory: publicProcedure
      .input(z.object({ sessionToken: z.string() }))
      .query(async ({ input }) => {
        const lead = await getLeadBySessionToken(input.sessionToken);
        if (!lead) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão inválida." });
        const history = await getChatHistory(lead.id);
        return history.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          imageUrls: m.imageUrls as string[] | null,
          createdAt: m.createdAt,
        }));
      }),
  }),
});

export type AppRouter = typeof appRouter;
