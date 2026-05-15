// ─── Auth SDK — JWT session (no external OAuth dependency) ───────────────────
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const getSecret = () => new TextEncoder().encode(ENV.cookieSecret);

export type SessionPayload = {
  userId: number;
  name: string;
};

export const sdk = {
  /**
   * Create a signed JWT session token for a user.
   */
  async createSessionToken(userId: number, name: string): Promise<string> {
    return new SignJWT({ userId, name })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1y")
      .sign(getSecret());
  },

  /**
   * Verify a session token and return the payload.
   */
  async verifySessionToken(token: string): Promise<SessionPayload> {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  },

  /**
   * Authenticate an incoming Express request via session cookie.
   * Returns the User row or null if unauthenticated.
   */
  async authenticateRequest(req: Request): Promise<User | null> {
    const cookieHeader = req.headers.cookie ?? "";
    const cookies = parseCookieHeader(cookieHeader);
    const token = cookies[COOKIE_NAME];
    if (!token) return null;
    try {
      const payload = await sdk.verifySessionToken(token);
      const user = await db.getUserById(payload.userId);
      return user ?? null;
    } catch {
      return null;
    }
  },
};
