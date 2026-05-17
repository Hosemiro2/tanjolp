import { integer, pgEnum, pgTable, serial, text, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const chatRoleEnum = pgEnum("chat_role", ["user", "assistant"]);
export const leadCategoriaEnum = pgEnum("lead_categoria", [
  "empresario",
  "designer",
  "entusiasta",
  "indefinido",
]);

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Leads ────────────────────────────────────────────────────────────────────
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 20 }).notNull(),
  empresa: varchar("empresa", { length: 255 }),
  sessionToken: varchar("sessionToken", { length: 64 }).notNull().unique(),
  imagesGenerated: integer("imagesGenerated").default(0).notNull(),
  classificacao: leadCategoriaEnum("classificacao").default("indefinido").notNull(),
  score: integer("score").default(0).notNull(),
  sinais: jsonb("sinais").$type<string[]>().default([]).notNull(),
  classificadoEm: timestamp("classificadoEm", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ─── Chat Messages ────────────────────────────────────────────────────────────
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  leadId: integer("leadId").notNull(),
  role: chatRoleEnum("role").notNull(),
  content: text("content").notNull(),
  imageUrls: jsonb("imageUrls").$type<string[]>(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
