import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

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
    isAdmin: false,
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

// ─── Leads Register — Input validation ───────────────────────────────────────
describe("leads.register input validation", () => {
  function makePublicCtx(): TrpcContext {
    return {
      user: null,
      isAdmin: false,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as TrpcContext["res"],
    };
  }

  it("rejects registration when name is too short", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.leads.register({
        nome: "Jo",
        email: "teste@marca.com.br",
        whatsapp: "11999999999",
      })
    ).rejects.toThrow();
  });

  it("rejects registration with invalid email", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.leads.register({
        nome: "Teste Lead",
        email: "not-an-email",
        whatsapp: "11999999999",
      })
    ).rejects.toThrow();
  });

  it("rejects registration when whatsapp is too short", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.leads.register({
        nome: "Teste Lead",
        email: "teste@marca.com.br",
        whatsapp: "1199",
      })
    ).rejects.toThrow();
  });
});
