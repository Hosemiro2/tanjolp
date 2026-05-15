// ─── OAuth Routes — simple email/password or magic link (no Manus dependency) ─
// The original project used Manus OAuth. Since you're running standalone,
// authentication is optional — all lead and Danya routes are publicProcedure.
//
// To add login, implement one of:
//   A) Email magic link (Resend + jose)
//   B) Google OAuth (passport-google-oauth20)
//   C) Username/password (bcrypt + jwt)
//
// For now, this file registers no routes so the app runs without auth.
import type { Express } from "express";

export function registerOAuthRoutes(_app: Express) {
  // No-op: add your auth routes here if needed
}
