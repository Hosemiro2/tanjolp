import { eq, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { InsertUser, users, leads, chatMessages, InsertLead, InsertChatMessage } from "../drizzle/schema";
import { ENV } from './_core/env';

const sqlCount = () => sql<number>`count(*)`;

type DrizzleDb = ReturnType<typeof drizzle>;

let _pool: Pool | null = null;
let _db: DrizzleDb | null = null;

export async function getDb(): Promise<DrizzleDb | null> {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = new Pool({ connectionString: process.env.DATABASE_URL });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _pool = null;
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    // Note: to set admin role, update the database directly
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db
      .insert(users)
      .values(values)
      .onConflictDoUpdate({ target: users.openId, set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Leads ────────────────────────────────────────────────────────────────────
export async function createLead(data: InsertLead) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Postgres supports RETURNING — single round trip
  const inserted = await db.insert(leads).values(data).returning();
  return inserted[0];
}

export async function getLeadBySessionToken(sessionToken: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(leads).where(eq(leads.sessionToken, sessionToken)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function incrementLeadImages(leadId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const lead = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  if (lead[0]) {
    await db.update(leads).set({ imagesGenerated: lead[0].imagesGenerated + 1 }).where(eq(leads.id, leadId));
  }
}

// ─── Admin Panel queries ──────────────────────────────────────────────────────
export async function listLeads({ page, pageSize }: { page: number; pageSize: number }) {
  const db = await getDb();
  if (!db) return { rows: [], total: 0 };
  const offset = Math.max(0, (page - 1) * pageSize);
  const rows = await db
    .select()
    .from(leads)
    .orderBy(desc(leads.createdAt))
    .limit(pageSize)
    .offset(offset);
  const totalResult = await db.select({ count: sqlCount() }).from(leads);
  const total = Number(totalResult[0]?.count ?? 0);
  return { rows, total };
}

export async function getLeadById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Chat Messages ────────────────────────────────────────────────────────────
export async function saveChatMessage(data: InsertChatMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(chatMessages).values(data);
}

export async function getChatHistory(leadId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages).where(eq(chatMessages.leadId, leadId)).orderBy(chatMessages.createdAt);
}

// ─── Get user by numeric ID (used by standalone JWT auth) ─────────────────────
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Lead Classification ────────────────────────────────────────────────────

export async function updateLeadClassification(
  leadId: number,
  data: {
    classificacao: "empresario" | "designer" | "entusiasta" | "indefinido";
    score: number;
    sinais: string[];
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(leads)
    .set({
      classificacao: data.classificacao,
      score: data.score,
      sinais: data.sinais,
      classificadoEm: new Date(),
    })
    .where(eq(leads.id, leadId));
}

export async function clearLeadClassification(leadId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(leads)
    .set({
      classificacao: "indefinido",
      score: 0,
      sinais: [],
      classificadoEm: null,
    })
    .where(eq(leads.id, leadId));
}

/**
 * Retorna IDs de leads que precisam ser classificados:
 * - classificadoEm IS NULL
 * - última mensagem foi há mais de `maxAgeMinutes` minutos
 * - lead tem pelo menos 4 mensagens do usuário no histórico
 *
 * Nota: as colunas do schema usam camelCase quoted (ver drizzle/schema.ts),
 * por isso "leadId" e "createdAt" precisam estar entre aspas duplas no SQL.
 */
export async function getLeadsToClassify(maxAgeMinutes: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];

  const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);

  const result = await db.execute(sql`
    SELECT l.id
    FROM leads l
    WHERE l."classificadoEm" IS NULL
      AND EXISTS (
        SELECT 1
        FROM chat_messages cm
        WHERE cm."leadId" = l.id
        GROUP BY cm."leadId"
        HAVING MAX(cm."createdAt") < ${cutoff.toISOString()}
           AND COUNT(*) FILTER (WHERE cm.role = 'user') >= 4
      )
    ORDER BY l.id ASC
    LIMIT 25
  `);

  // node-postgres returns { rows: [...] }; drizzle's execute proxies it.
  const rows =
    (result as unknown as { rows?: Array<{ id: number | string }> }).rows ??
    (result as unknown as Array<{ id: number | string }>);
  return rows.map((r) => Number(r.id));
}
