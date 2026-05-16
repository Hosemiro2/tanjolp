// ─── Owner Notification — Brevo transactional email ──────────────────────────
// Sends a plain-text email to the owner (env: OWNER_EMAIL) using Brevo's
// transactional API. Free tier: 300 emails/day.
// Docs: https://developers.brevo.com/reference/sendtransacemail
import { ENV } from "./env";

export type NotificationPayload = { title: string; content: string };

const BREVO_API = "https://api.brevo.com/v3/smtp/email";

/**
 * Send a notification email to the project owner.
 *
 * Returns true on success, false on failure (never throws — caller is meant
 * to swallow errors with `.catch(() => {})` so lead registration doesn't
 * fail if the email service is down).
 */
export async function notifyOwner(payload: NotificationPayload): Promise<boolean> {
  // Dev fallback: log to console if Brevo isn't configured.
  if (!ENV.brevoApiKey || !ENV.ownerEmail) {
    console.log(`[Notification][stub] ${payload.title}\n${payload.content}`);
    return true;
  }

  try {
    const res = await fetch(BREVO_API, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": ENV.brevoApiKey,
      },
      body: JSON.stringify({
        sender: { email: ENV.brevoSenderEmail, name: ENV.brevoSenderName },
        to: [{ email: ENV.ownerEmail }],
        subject: payload.title,
        textContent: payload.content,
        htmlContent: `<pre style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${escapeHtml(payload.content)}</pre>`,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[Brevo] ${res.status}: ${body || res.statusText}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Brevo] send failed:", err);
    return false;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
