import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FILE_NAME = 'Satyendra_Kumar_Namdeo_Resume.pdf';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'resume', FILE_NAME);
    const data = await readFile(filePath);

    return new NextResponse(data, {
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `inline; filename="${FILE_NAME}"`,
        'cache-control': 'public, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Default resume is not available in this deployment.' },
      { status: 404 },
    );
  }
}
