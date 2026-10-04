import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function maskEmail(value: string) {
  const [local, domain] = value.split('@');
  return local && domain ? `${local.slice(0, 2)}***@${domain}` : 'invalid';
}

async function checkSender(apiKey: string, senderEmail: string) {
  const response = await fetch('https://api.brevo.com/v3/senders?limit=50&offset=0', {
    headers: { accept: 'application/json', 'api-key': apiKey },
    cache: 'no-store',
  });

  if (!response.ok) return { ok: false, reason: `Brevo sender API returned ${response.status}` };

  const data = (await response.json()) as {
    senders?: Array<{ email?: string; active?: boolean; verified?: boolean }>;
  };

  const sender = data.senders?.find(
    (item) => item.email?.toLowerCase() === senderEmail.toLowerCase(),
  );

  if (!sender) return { ok: false, reason: 'Sender is not registered in Brevo.' };
  if (sender.active === false || sender.verified === false) {
    return { ok: false, reason: 'Sender is registered but not active/verified in Brevo.' };
  }

  return { ok: true, reason: 'Sender is registered and active.' };
}

export async function GET() {
  const apiKey = process.env.BREVO_API_KEY?.trim() || '';
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim() || '';
  const senderName = process.env.BREVO_SENDER_NAME?.trim() || '';

  if (!apiKey || !senderEmail) {
    return NextResponse.json(
      { ok: false, brevo: 'not_configured', configuration: 'Missing Brevo API key or sender email.' },
      { status: 503 },
    );
  }

  if (!validEmail(senderEmail)) {
    return NextResponse.json(
      {
        ok: false,
        brevo: 'invalid_configuration',
        configuration: 'BREVO_SENDER_EMAIL must be an email address, not the sender display name.',
        sender: { email: senderEmail, name: senderName },
      },
      { status: 503 },
    );
  }

  try {
    const account = await fetch('https://api.brevo.com/v3/account', {
      headers: { accept: 'application/json', 'api-key': apiKey },
      cache: 'no-store',
    });

    if (!account.ok) {
      return NextResponse.json(
        { ok: false, brevo: 'rejected', status: account.status },
        { status: 502 },
      );
    }

    const sender = await checkSender(apiKey, senderEmail);

    return NextResponse.json(
      {
        ok: sender.ok,
        brevo: sender.ok ? 'connected' : 'sender_not_ready',
        sender: {
          email: maskEmail(senderEmail),
          name: senderName || 'MultiApply',
          status: sender.reason,
        },
      },
      { status: sender.ok ? 200 : 503 },
    );
  } catch {
    return NextResponse.json({ ok: false, brevo: 'unreachable' }, { status: 503 });
  }
}
