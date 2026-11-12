/**
 * Minimal mailer: uses Resend when RESEND_API_KEY is set, otherwise logs the message
 * to the server console (development).
 */
export async function sendEmail(to: string, subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`\n[email:dev] To: ${to}\nSubject: ${subject}\n\n${text}\n`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM || "Nira <no-reply@nira.local>", to, subject, text }),
  });
  if (!res.ok) console.warn("[email] send failed", res.status);
}
