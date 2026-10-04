type AppConfig = {
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
  SESSION_SECRET: string;
  NEXT_PUBLIC_APP_URL: string;
  BREVO_API_KEY: string;
  BREVO_SENDER_EMAIL: string;
  BREVO_SENDER_NAME: string;
  BREVO_REPLY_TO_EMAIL?: string;
  BREVO_REPLY_TO_NAME?: string;
  EMAIL_DELAY_MS: number;
  MAX_RECIPIENTS_PER_CAMPAIGN: number;
  MAX_ATTACHMENT_SIZE_MB: number;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
};

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function email(name: string): string {
  const value = required(name);
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value)) {
    throw new Error(`Invalid email environment variable: ${name}`);
  }
  return value;
}

function integer(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`Invalid environment variable: ${name}`);
  }
  return value;
}

export function authEnv() {
  return {
    ADMIN_EMAIL: email('ADMIN_EMAIL'),
    ADMIN_PASSWORD: required('ADMIN_PASSWORD'),
    SESSION_SECRET: required('SESSION_SECRET'),
  };
}

export function emailEnv() {
  return {
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000',
    BREVO_API_KEY: required('BREVO_API_KEY'),
    BREVO_SENDER_EMAIL: email('BREVO_SENDER_EMAIL'),
    BREVO_SENDER_NAME:
      process.env.BREVO_SENDER_NAME?.trim() || 'MultiApply',
    BREVO_REPLY_TO_EMAIL: process.env.BREVO_REPLY_TO_EMAIL?.trim() || undefined,
    BREVO_REPLY_TO_NAME: process.env.BREVO_REPLY_TO_NAME?.trim() || undefined,
    EMAIL_DELAY_MS: integer('EMAIL_DELAY_MS', 500, 0, 10000),
    MAX_RECIPIENTS_PER_CAMPAIGN: integer(
      'MAX_RECIPIENTS_PER_CAMPAIGN',
      50,
      1,
      200,
    ),
    MAX_ATTACHMENT_SIZE_MB: integer(
      'MAX_ATTACHMENT_SIZE_MB',
      10,
      1,
      25,
    ),
  };
}

export function storageEnv() {
  return {
    SUPABASE_URL: process.env.SUPABASE_URL?.trim() || undefined,
    SUPABASE_SERVICE_ROLE_KEY:
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || undefined,
  };
}

export function env(): AppConfig {
  return {
    ...authEnv(),
    ...emailEnv(),
    ...storageEnv(),
  };
}
