import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { parse as parseCookieHeader } from "cookie";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { ADMIN_COOKIE_NAME, verifyAdminCookie } from "./adminAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  isAdmin: boolean;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // ─── Admin panel auth (HMAC cookie) ─────────────────────────────────────────
  const cookieHeader = opts.req.headers.cookie ?? "";
  const cookies = parseCookieHeader(cookieHeader);
  const isAdmin = verifyAdminCookie(cookies[ADMIN_COOKIE_NAME]);

  return {
    req: opts.req,
    res: opts.res,
    user,
    isAdmin,
  };
}
