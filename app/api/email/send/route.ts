import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSession } from '@/lib/session';
import { parseRecipients } from '@/lib/recipients';
import { sendMail } from '@/lib/brevo';
import { createCampaign, finishCampaign, updateRecipient } from '@/lib/store';
import { memoryJobs } from '@/lib/state';
import { getEmailConfig } from '@/lib/config';

export const runtime = 'nodejs';
export const maxDuration = 60;

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

export async function POST(req: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let config: ReturnType<typeof getEmailConfig>;

  try {
    config = getEmailConfig();
  } catch (error) {
    console.error('MultiApply email configuration error:', error);
    return NextResponse.json(
      { error: 'Email service is not configured correctly.' },
      { status: 503 },
    );
  }

  try {
    const form = await req.formData();
    const rawRecipients = String(form.get('recipients') || '');
    const subject = String(form.get('subject') || '').trim();
    const text = String(form.get('bodyText') || '').trim();
    const html = String(form.get('bodyHtml') || '').trim();
    const parsed = parseRecipients(rawRecipients);

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

    if (parsed.valid.length > config.MAX_RECIPIENTS_PER_CAMPAIGN) {
      return NextResponse.json(
        {
          error: `Maximum ${config.MAX_RECIPIENTS_PER_CAMPAIGN} recipients per campaign`,
          invalid: parsed.invalid,
        },
        { status: 400 },
      );
    }

    const files: { filename: string; contentType: string; data: Buffer }[] = [];
    let totalBytes = 0;

    for (const value of form.getAll('attachments')) {
      if (!(value instanceof File) || value.size === 0) continue;

      if (value.size > config.MAX_ATTACHMENT_SIZE_MB * 1024 * 1024) {
        return NextResponse.json(
          {
            error: `Attachment ${value.name} exceeds ${config.MAX_ATTACHMENT_SIZE_MB} MB`,
          },
          { status: 400 },
        );
      }

      totalBytes += value.size;
      files.push({
        filename: value.name.replace(/[\\\\/]/g, '_').slice(0, 180),
        contentType: value.type || 'application/octet-stream',
        data: Buffer.from(await value.arrayBuffer()),
      });
    }

    if (totalBytes > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Combined attachments must be below 20 MB.' },
        { status: 400 },
      );
    }

    const generatedId = randomUUID();
    const storedId = await createCampaign(
      session.email,
      subject,
      parsed.valid,
    );
    const jobId = storedId || generatedId;

    memoryJobs.set(jobId, {
      total: parsed.valid.length,
      sent: 0,
      failed: 0,
      status: 'sending',
      results: [],
    });

    for (let index = 0; index < parsed.valid.length; index += 1) {
      const to = parsed.valid[index];

      try {
        const result = await sendMail({
          to,
          subject,
          html: html || textToHtml(text),
          text,
          files,
        });

        const job = memoryJobs.get(jobId);
        if (!job) break;

        job.sent += 1;
        job.results.push({
          email: to,
          status: 'sent',
          messageId: result.messageId || undefined,
        });

        await updateRecipient(jobId, to, 'sent');
      } catch (error) {
        const job = memoryJobs.get(jobId);
        if (!job) break;

        const message =
          error instanceof Error ? error.message.slice(0, 300) : 'Email provider error';

        job.failed += 1;
        job.results.push({ email: to, status: 'failed', error: message });

        await updateRecipient(jobId, to, 'failed', message);
      }

      if (index < parsed.valid.length - 1 && config.EMAIL_DELAY_MS > 0) {
        await new Promise((resolve) => setTimeout(resolve, config.EMAIL_DELAY_MS));
      }
    }

    const job = memoryJobs.get(jobId);
    if (job) {
      job.status = 'completed';
      await finishCampaign(jobId, job.sent, job.failed);

      return NextResponse.json({
        jobId,
        status: job.status,
        total: job.total,
        sent: job.sent,
        failed: job.failed,
        invalid: parsed.invalid,
        results: job.results,
      });
    }

    return NextResponse.json({ error: 'Campaign state was lost' }, { status: 500 });
  } catch (error) {
    console.error('MultiApply email send error:', error);
    return NextResponse.json(
      { error: 'Unable to process the email campaign.' },
      { status: 500 },
    );
  }
}
