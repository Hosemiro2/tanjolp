import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── CNPJ Validation (mirrored from routers.ts for testing) ──────────────────
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

// ─── CNPJ Tests ───────────────────────────────────────────────────────────────
describe("CNPJ Validation", () => {
  it("accepts a valid CNPJ (11.222.333/0001-81)", () => {
    expect(validateCNPJ("11222333000181")).toBe(true);
  });

  it("accepts a valid CNPJ with formatting", () => {
    expect(validateCNPJ("11.222.333/0001-81")).toBe(true);
  });

  it("rejects a CNPJ with all same digits", () => {
    expect(validateCNPJ("11111111111111")).toBe(false);
  });

  it("rejects a CNPJ with wrong check digits", () => {
    expect(validateCNPJ("11222333000182")).toBe(false);
  });

  it("rejects a CNPJ with wrong length", () => {
    expect(validateCNPJ("1122233300018")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(validateCNPJ("")).toBe(false);
  });

  it("rejects a known invalid CNPJ (00.000.000/0000-00)", () => {
    expect(validateCNPJ("00000000000000")).toBe(false);
  });
});

// ─── Auth Logout Test ─────────────────────────────────────────────────────────
type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: { name: string; options: Record<string, unknown> }[] } {
  const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1, httpOnly: true, path: "/" });
  });
});

// ─── Leads Register — CNPJ rejection ─────────────────────────────────────────
describe("leads.register", () => {
  it("rejects registration with invalid CNPJ", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.leads.register({
        nome: "Teste Lead",
        email: "teste@marca.com.br",
        whatsapp: "11999999999",
        cnpj: "00000000000000", // invalid
      })
    ).rejects.toThrow("CNPJ inválido");
  });
});
