import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSessionFromRequest } from '@/lib/session';
import { parseRecipients } from '@/lib/recipients';
import { memoryJobs } from '@/lib/state';

export const runtime = 'nodejs';
export const maxDuration = 60;

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function numberEnv(name: string, fallback: number) {
  const value = Number(process.env[name] || fallback);
  return Number.isFinite(value) ? value : fallback;
}

function textToHtml(text: string) {
  return text
    .split(/\r?\n/)
    .map(
      (line) =>
        '<p>' +
        line
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;') +
        '</p>',
    )
    .join('');
}

async function sendBrevo(
  to: string,
  subject: string,
  html: string,
  text: string,
  files: { filename: string; data: Buffer }[],
) {
  const apiKey = required('BREVO_API_KEY');
  const senderEmail = required('BREVO_SENDER_EMAIL');
  const senderName = process.env.BREVO_SENDER_NAME?.trim() || 'MultiApply';

  const payload: Record<string, unknown> = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: to }],
    subject,
    htmlContent: html,
    textContent: text,
    tags: ['multiapply'],
  };

  const replyTo = process.env.BREVO_REPLY_TO_EMAIL?.trim();
  if (replyTo) {
    payload.replyTo = {
      email: replyTo,
      name: process.env.BREVO_REPLY_TO_NAME?.trim() || undefined,
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
        'api-key': apiKey,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (response.ok) {
      const data = (await response.json()) as { messageId?: string };
      return data.messageId || undefined;
    }

    let detail = '';
    try {
      const data = await response.json();
      detail = data?.message || data?.code || '';
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

export async function POST(req: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const maxRecipients = Math.min(
      50,
      Math.max(1, numberEnv('MAX_RECIPIENTS_PER_CAMPAIGN', 20)),
    );
    const maxFileMb = Math.min(
      25,
      Math.max(1, numberEnv('MAX_ATTACHMENT_SIZE_MB', 10)),
    );
    const delayMs = Math.min(
      10000,
      Math.max(0, numberEnv('EMAIL_DELAY_MS', 500)),
    );

    const form = await req.formData();
    const parsed = parseRecipients(String(form.get('recipients') || ''));
    const subject = String(form.get('subject') || '').trim();
    const text = String(form.get('bodyText') || '').trim();
    const html = String(form.get('bodyHtml') || '').trim();

    if (!subject) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }

    if (!text && !html) {
      return NextResponse.json({ error: 'Message body is required' }, { status: 400 });
    }

    if (!parsed.valid.length) {
      return NextResponse.json(
        { error: 'Enter at least one valid recipient', invalid: parsed.invalid },
        { status: 400 },
      );
    }

    if (parsed.valid.length > maxRecipients) {
      return NextResponse.json(
        { error: `Maximum ${maxRecipients} recipients per campaign`, invalid: parsed.invalid },
        { status: 400 },
      );
    }

    const files: { filename: string; data: Buffer }[] = [];
    let totalBytes = 0;

    for (const value of form.getAll('attachments')) {
      if (!(value instanceof File) || value.size === 0) continue;

      if (value.size > maxFileMb * 1024 * 1024) {
        return NextResponse.json(
          { error: `Attachment ${value.name} exceeds ${maxFileMb} MB` },
          { status: 400 },
        );
      }

      totalBytes += value.size;
      files.push({
        filename: value.name.replace(/[\\\\/]/g, '_').slice(0, 180),
        data: Buffer.from(await value.arrayBuffer()),
      });
    }

    if (totalBytes > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Combined attachments must be below 20 MB.' },
        { status: 400 },
      );
    }

    const jobId = randomUUID();

    memoryJobs.set(jobId, {
      total: parsed.valid.length,
      sent: 0,
      failed: 0,
      status: 'sending',
      results: [],
    });

    const job = memoryJobs.get(jobId)!;

    for (let index = 0; index < parsed.valid.length; index += 1) {
      const recipient = parsed.valid[index];

      try {
        const messageId = await sendBrevo(
          recipient,
          subject,
          html || textToHtml(text),
          text,
          files,
        );

        job.sent += 1;
        job.results.push({
          email: recipient,
          status: 'sent',
          messageId,
        });
      } catch (error) {
        job.failed += 1;
        job.results.push({
          email: recipient,
          status: 'failed',
          error: error instanceof Error ? error.message.slice(0, 300) : 'Brevo error',
        });
      }

      if (index < parsed.valid.length - 1 && delayMs) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    job.status = 'completed';

    return NextResponse.json({
      jobId,
      status: job.status,
      total: job.total,
      sent: job.sent,
      failed: job.failed,
      invalid: parsed.invalid,
      results: job.results,
    });
  } catch (error) {
    console.error('MultiApply email error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Email service failed' },
      { status: 503 },
    );
  }
}
