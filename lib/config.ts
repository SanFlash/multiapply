import { z } from 'zod';
const schema=z.object({
 NEXT_PUBLIC_APP_URL:z.string().url().default('http://localhost:3000'),
 GOOGLE_CLIENT_ID:z.string().min(1),GOOGLE_CLIENT_SECRET:z.string().min(1),GOOGLE_REDIRECT_URI:z.string().url(),
 SESSION_SECRET:z.string().min(32),
 SUPABASE_URL:z.string().url().optional(),SUPABASE_ANON_KEY:z.string().optional(),SUPABASE_SERVICE_ROLE_KEY:z.string().optional(),
 EMAIL_BATCH_SIZE:z.coerce.number().int().min(1).max(10).default(3),EMAIL_DELAY_MS:z.coerce.number().int().min(0).max(10000).default(800),
 MAX_RECIPIENTS_PER_CAMPAIGN:z.coerce.number().int().min(1).max(200).default(50),MAX_ATTACHMENT_SIZE_MB:z.coerce.number().min(1).max(25).default(10)
});
export function env(){return schema.parse(process.env);}