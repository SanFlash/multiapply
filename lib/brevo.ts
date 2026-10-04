import { getEmailConfig } from './config';

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
  files: { filename: string; contentType: string; data: Buffer }[];
};

export async function sendMail({ to, subject, html, text, files }: SendArgs) {
  const config = getEmailConfig();

  const payload: Record<string, unknown> = {
    sender: {
      name: config.BREVO_SENDER_NAME,
      email: config.BREVO_SENDER_EMAIL,
    },
    to: [{ email: to }],
    subject,
    htmlContent: html,
    textContent: text,
    tags: ['multiapply'],
  };

  if (config.BREVO_REPLY_TO_EMAIL) {
    payload.replyTo = {
      email: config.BREVO_REPLY_TO_EMAIL,
      name: config.BREVO_REPLY_TO_NAME,
    };
  }

  if (files.length) {
    payload.attachment = files.map((file) => ({
      name: file.filename,
      content: file.data.toString('base64'),
    }));
  }

  let lastError = 'Brevo request failed';

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': config.BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (response.ok) {
      const result = (await response.json()) as { messageId?: string };
      return { messageId: result.messageId || null };
    }

    let detail = '';
    try {
      const body = await response.json();
      detail = body?.message || body?.code || '';
    } catch {}

    lastError = `Brevo ${response.status}${detail ? `: ${detail}` : ''}`;

    if (response.status !== 429 && response.status < 500) break;

    if (attempt < 2) {
      await new Promise((resolve) =>
        setTimeout(resolve, 500 * 2 ** attempt),
      );
    }
  }

  throw new Error(lastError);
}
