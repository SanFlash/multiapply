import { z } from 'zod';

const schema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(8),
  SESSION_SECRET: z.string().min(32),
  BREVO_API_KEY: z.string().min(1),
  BREVO_SENDER_EMAIL: z.string().email(),
  BREVO_SENDER_NAME: z.string().min(1).default('MultiApply'),
  BREVO_REPLY_TO_EMAIL: z.string().email().optional(),
  BREVO_REPLY_TO_NAME: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  EMAIL_DELAY_MS: z.coerce.number().int().min(0).max(10000).default(500),
  MAX_RECIPIENTS_PER_CAMPAIGN: z.coerce.number().int().min(1).max(200).default(50),
  MAX_ATTACHMENT_SIZE_MB: z.coerce.number().min(1).max(25).default(10)
});
export function env() { return schema.parse(process.env); }