import { randomUUID } from 'crypto';

type Campaign = {
  id: string;
  senderEmail: string;
  subject: string;
  recipients: Array<{
    email: string;
    status: 'pending' | 'sent' | 'failed';
    error?: string;
    sentAt?: string;
  }>;
  status: string;
  createdAt: string;
  completedAt?: string;
};

const campaigns = new Map<string, Campaign>();

export async function createCampaign(
  email: string,
  subject: string,
  recipients: string[],
) {
  const id = randomUUID();

  campaigns.set(id, {
    id,
    senderEmail: email,
    subject,
    recipients: recipients.map((recipient) => ({
      email: recipient,
      status: 'pending',
    })),
    status: 'sending',
    createdAt: new Date().toISOString(),
  });

  return id;
}

export async function updateRecipient(
  jobId: string,
  email: string,
  status: 'sent' | 'failed',
  error?: string,
) {
  const campaign = campaigns.get(jobId);
  const recipient = campaign?.recipients.find((item) => item.email === email);

  if (!recipient) return;

  recipient.status = status;
  recipient.error = error;
  if (status === 'sent') recipient.sentAt = new Date().toISOString();
}

export async function finishCampaign(
  jobId: string,
  success: number,
  failed: number,
) {
  const campaign = campaigns.get(jobId);
  if (!campaign) return;

  campaign.status = failed ? 'completed_with_errors' : 'completed';
  campaign.completedAt = new Date().toISOString();
}

export async function history(email: string) {
  return [...campaigns.values()]
    .filter((campaign) => campaign.senderEmail === email)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 30);
}

export async function campaign(jobId: string) {
  return campaigns.get(jobId)?.recipients || null;
}
