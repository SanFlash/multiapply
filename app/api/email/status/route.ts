import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session';
import { memoryJobs } from '@/lib/state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!getSessionFromRequest(req)) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const job = memoryJobs.get(id);
  if (!job) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  return NextResponse.json({ jobId: id, ...job });
}
