export const ENV = {
  // ─── Core ────────────────────────────────────────────────────────────────────
  databaseUrl: process.env.DATABASE_URL ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "change-me-to-a-long-random-secret",
  isProduction: process.env.NODE_ENV === "production",
  port: parseInt(process.env.PORT ?? "3000"),
  ownerEmail: process.env.OWNER_EMAIL ?? "comercial@tanjoo.com.br",
  publicUrl: process.env.PUBLIC_URL ?? "http://localhost:3000",

  // ─── LLM — Anthropic Claude (chat / Danya) ──────────────────────────────────
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  anthropicModel: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5",

  // ─── Image Generation — Leonardo AI ─────────────────────────────────────────
  leonardoApiKey: process.env.LEONARDO_API_KEY ?? "",
  // Default model: Leonardo Phoenix 1.0 (good for photoreal product shots)
  leonardoModelId: process.env.LEONARDO_MODEL_ID ?? "de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3",

  // ─── Email — Brevo ──────────────────────────────────────────────────────────
  brevoApiKey: process.env.BREVO_API_KEY ?? "",
  brevoSenderEmail: process.env.BREVO_SENDER_EMAIL ?? "no-reply@tanjoo.com.br",
  brevoSenderName: process.env.BREVO_SENDER_NAME ?? "TANJŌ Studio",

  // ─── Storage — Cloudflare R2 (S3-compatible) ────────────────────────────────
  r2AccountId: process.env.R2_ACCOUNT_ID ?? "",
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  r2Bucket: process.env.R2_BUCKET ?? "tanjo-studio",
  r2PublicBaseUrl: process.env.R2_PUBLIC_BASE_URL ?? "", // ex: https://images.tanjoo.com.br

  // ─── Admin Panel ─────────────────────────────────────────────────────────────
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  adminSessionSecret: process.env.ADMIN_SESSION_SECRET ?? "change-me-admin-secret",
};
