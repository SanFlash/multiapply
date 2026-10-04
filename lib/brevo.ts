import { env } from './config';

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
  files: { filename: string; contentType: string; data: Buffer }[];
};

export async function sendMail({ to, subject, html, text, files }: SendArgs) {
  const e = env();
  const payload: Record<string, unknown> = {
    sender: { name: e.BREVO_SENDER_NAME, email: e.BREVO_SENDER_EMAIL },
    to: [{ email: to }],
    subject,
    htmlContent: html,
    textContent: text,
    tags: ['multiapply'],
  };
  if (e.BREVO_REPLY_TO_EMAIL) {
    payload.replyTo = { email: e.BREVO_REPLY_TO_EMAIL, name: e.BREVO_REPLY_TO_NAME || undefined };
  }
  if (files.length) {
    payload.attachment = files.map((file) => ({
      name: file.filename,
      content: file.data.toString('base64'),
    }));
  }
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json', 'api-key': e.BREVO_API_KEY },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });
  if (!response.ok) {
    let detail = '';
    try { const body = await response.json(); detail = body?.message || body?.code || ''; } catch {}
    throw new Error('Brevo ' + response.status + (detail ? ': ' + detail : ''));
  }
  const result = await response.json() as { messageId?: string };
  return { messageId: result.messageId || null };
}