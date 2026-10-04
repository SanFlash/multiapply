import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
let storageDisabled = false;

function db() {
  if (storageDisabled) return null;

  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  // Supabase is optional. Empty/missing values must never break the UI.
  if (!url || !key) return null;

  try {
    client ||= createClient(url, key, {
      auth: { persistSession: false },
    });
    return client;
  } catch {
    storageDisabled = true;
    return null;
  }
}

export async function createCampaign(
  email: string,
  subject: string,
  recipients: string[],
) {
  const d = db();
  if (!d) return null;

  try {
    const { data, error } = await d
      .from('email_jobs')
      .insert({
        sender_email: email,
        subject,
        total_recipients: recipients.length,
        status: 'sending',
      })
      .select()
      .single();

    if (error) throw error;

    await d.from('email_recipients').insert(
      recipients.map((r) => ({ job_id: data.id, email: r, status: 'pending' })),
    );

    return data.id as string;
  } catch {
    return null;
  }
}

export async function updateRecipient(
  jobId: string,
  email: string,
  status: 'sent' | 'failed',
  errorMessage?: string,
) {
  const d = db();
  if (!d) return;

  try {
    await d
      .from('email_recipients')
      .update({
        status,
        error_message: errorMessage || null,
        sent_at: status === 'sent' ? new Date().toISOString() : null,
      })
      .eq('job_id', jobId)
      .eq('email', email);
  } catch {
    // Persistence is optional and must never prevent email delivery.
  }
}

export async function finishCampaign(
  jobId: string,
  success: number,
  failed: number,
) {
  const d = db();
  if (!d) return;

  try {
    await d
      .from('email_jobs')
      .update({
        status: failed ? 'completed_with_errors' : 'completed',
        successful_count: success,
        failed_count: failed,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);
  } catch {
    // Persistence is optional.
  }
}

export async function history(email: string) {
  const d = db();
  if (!d) return [];

  try {
    const { data } = await d
      .from('email_jobs')
      .select(
        'id,subject,status,total_recipients,successful_count,failed_count,created_at,completed_at',
      )
      .eq('sender_email', email)
      .order('created_at', { ascending: false })
      .limit(30);

    return data || [];
  } catch {
    return [];
  }
}

export async function campaign(jobId: string) {
  const d = db();
  if (!d) return null;

  try {
    const { data } = await d
      .from('email_recipients')
      .select('email,status,error_message,sent_at')
      .eq('job_id', jobId);

    return data || [];
  } catch {
    return null;
  }
}
