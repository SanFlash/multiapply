import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { memoryJobs } from '@/lib/state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FINAL_EVENTS = new Set([
  'delivered',
  'hard_bounce',
  'soft_bounce',
  'blocked',
  'spam',
  'invalid_email',
  'error',
  'unsubscribed',
]);

const LABELS: Record<string, string> = {
  request: 'Accepted by Brevo',
  sent: 'Sent',
  delivered: 'Delivered',
  deferred: 'Deferred',
  soft_bounce: 'Soft bounced',
  hard_bounce: 'Hard bounced',
  blocked: 'Blocked',
  spam: 'Marked as spam',
  invalid_email: 'Invalid email',
  error: 'Delivery error',
  unsubscribed: 'Unsubscribed',
};

async function brevoStatus(messageId: string) {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) throw new Error('Brevo is not configured');

  const url = new URL('https://api.brevo.com/v3/smtp/statistics/events');
  url.searchParams.set('messageId', messageId);
  url.searchParams.set('limit', '10');
  url.searchParams.set('sort', 'desc');
  url.searchParams.set('days', '7');

  const response = await fetch(url, {
    headers: { accept: 'application/json', 'api-key': apiKey },
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.message || data?.code || 'Brevo status check failed (' + response.status + ')',
    );
  }

  const events = Array.isArray(data?.events) ? data.events : [];
  const event = events.find((item: any) => item?.messageId === messageId) || events[0];

  if (!event) {
    return {
      messageId,
      status: 'accepted',
      label: 'Accepted by Brevo',
      final: false,
      reason: null,
      date: null,
    };
  }

  const status = String(event.event || '').toLowerCase();
  return {
    messageId,
    status: status || 'unknown',
    label: LABELS[status] || status || 'Processing',
    final: FINAL_EVENTS.has(status),
    recipient: event.email,
    reason: event.reason || null,
    date: event.date || null,
  };
}

export async function GET(req: Request) {
  if (!getSessionFromRequest(req)) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const url = new URL(req.url);
  const messageId = url.searchParams.get('messageId')?.trim();

  if (messageId) {
    try {
      return NextResponse.json(await brevoStatus(messageId));
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unable to check delivery status' },
        { status: 502 },
      );
    }
  }

  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id or messageId' }, { status: 400 });
  }

  const job = memoryJobs.get(id);
  if (!job) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  return NextResponse.json({ jobId: id, ...job });
}
