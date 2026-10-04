import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSession } from '@/lib/session';
import { parseRecipients } from '@/lib/recipients';
import { sendMail } from '@/lib/brevo';
import { createCampaign, finishCampaign, updateRecipient } from '@/lib/store';
import { memoryJobs } from '@/lib/state';
import { env } from '@/lib/config';

export const runtime = 'nodejs';
export const maxDuration = 60;

function textToHtml(text: string) {
  return text.split(/\r?\n/).map((line) => '<p>' + line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</p>').join('');
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const e = env();
  const form = await req.formData();
  const raw = String(form.get('recipients') || '');
  const subject = String(form.get('subject') || '').trim();
  const text = String(form.get('bodyText') || '').trim();
  const html = String(form.get('bodyHtml') || '').trim();
  const parsed = parseRecipients(raw);
  if (!subject) return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
  if (!text && !html) return NextResponse.json({ error: 'Message body is required' }, { status: 400 });
  if (!parsed.valid.length) return NextResponse.json({ error: 'Enter at least one valid recipient', invalid: parsed.invalid }, { status: 400 });
  if (parsed.valid.length > e.MAX_RECIPIENTS_PER_CAMPAIGN) return NextResponse.json({ error: 'Maximum ' + e.MAX_RECIPIENTS_PER_CAMPAIGN + ' recipients per campaign', invalid: parsed.invalid }, { status: 400 });
  const files: { filename: string; contentType: string; data: Buffer }[] = [];
  let totalAttachmentBytes = 0;
  for (const value of form.getAll('attachments')) {
    if (!(value instanceof File)) continue;
    if (value.size > e.MAX_ATTACHMENT_SIZE_MB * 1024 * 1024) return NextResponse.json({ error: 'Attachment ' + value.name + ' exceeds ' + e.MAX_ATTACHMENT_SIZE_MB + ' MB' }, { status: 400 });
    totalAttachmentBytes += value.size;
    files.push({ filename: value.name.replace(/[\\\\/]/g,'_').slice(0,180), contentType: value.type || 'application/octet-stream', data: Buffer.from(await value.arrayBuffer()) });
  }
  if (totalAttachmentBytes > 20 * 1024 * 1024) return NextResponse.json({ error: 'Combined attachments are too large. Keep the total below 20 MB.' }, { status: 400 });
  const id = randomUUID();
  let jobId = await createCampaign(session.email, subject, parsed.valid);
  jobId ||= id;
  memoryJobs.set(jobId, { total: parsed.valid.length, sent: 0, failed: 0, status: 'sending', results: [] });
  let sent = 0, failed = 0;
  for (let i = 0; i < parsed.valid.length; i++) {
    const to = parsed.valid[i];
    try {
      const result = await sendMail({ to, subject, html: html || textToHtml(text), text, files });
      sent++;
      memoryJobs.get(jobId)!.sent = sent;
      memoryJobs.get(jobId)!.results.push({ email: to, status: 'sent', messageId: result.messageId });
      await updateRecipient(jobId, to, 'sent');
    } catch (error: any) {
      failed++;
      const message = error?.message?.slice(0,300) || 'Brevo provider error';
      memoryJobs.get(jobId)!.failed = failed;
      memoryJobs.get(jobId)!.results.push({ email: to, status: 'failed', error: message });
      await updateRecipient(jobId, to, 'failed', message);
    }
    if (i < parsed.valid.length - 1 && e.EMAIL_DELAY_MS) await new Promise((resolve) => setTimeout(resolve, e.EMAIL_DELAY_MS));
  }
  memoryJobs.get(jobId)!.status = 'completed';
  await finishCampaign(jobId, sent, failed);
  return NextResponse.json({ jobId, status: 'completed', total: parsed.valid.length, sent, failed, invalid: parsed.invalid, results: memoryJobs.get(jobId)!.results });
}