// ─── Owner Notification — console log fallback (replace with email/Slack) ────
export type NotificationPayload = { title: string; content: string };

/**
 * Notify the project owner. In production, replace this with an email
 * service (Resend, SendGrid, Nodemailer) or Slack webhook.
 */
export async function notifyOwner(payload: NotificationPayload): Promise<boolean> {
  console.log(`[Notification] ${payload.title}: ${payload.content}`);
  // TODO: send email via Resend/SendGrid or post to Slack webhook
  // Example with Resend:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({ from: "...", to: process.env.OWNER_EMAIL, subject: payload.title, text: payload.content });
  return true;
}
