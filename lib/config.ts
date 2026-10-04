type EmailConfig = {
  BREVO_API_KEY: string;
  BREVO_SENDER_EMAIL: string;
  BREVO_SENDER_NAME: string;
  BREVO_REPLY_TO_EMAIL?: string;
  BREVO_REPLY_TO_NAME?: string;
  EMAIL_DELAY_MS: number;
  MAX_RECIPIENTS_PER_CAMPAIGN: number;
  MAX_ATTACHMENT_SIZE_MB: number;
};

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function optional(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function validEmail(value: string, name: string): string {
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value)) {
    throw new Error(`Invalid email environment variable: ${name}`);
  }
  return value;
}

function numberEnv(name: string, fallback: number, min: number, max: number) {
  const raw = optional(name);
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`Invalid environment variable: ${name}`);
  }
  return value;
}

export function getAuthConfig() {
  const email = validEmail(required('ADMIN_EMAIL').toLowerCase(), 'ADMIN_EMAIL');
  const password = required('ADMIN_PASSWORD');
  const secret = required('SESSION_SECRET');

  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters');
  }
  if (secret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters');
  }

  return { email, password, secret };
}

export function getEmailConfig(): EmailConfig {
  return {
    BREVO_API_KEY: required('BREVO_API_KEY'),
    BREVO_SENDER_EMAIL: validEmail(
      required('BREVO_SENDER_EMAIL'),
      'BREVO_SENDER_EMAIL',
    ),
    BREVO_SENDER_NAME: optional('BREVO_SENDER_NAME') || 'MultiApply',
    BREVO_REPLY_TO_EMAIL: optional('BREVO_REPLY_TO_EMAIL'),
    BREVO_REPLY_TO_NAME: optional('BREVO_REPLY_TO_NAME'),
    EMAIL_DELAY_MS: numberEnv('EMAIL_DELAY_MS', 500, 0, 10000),
    MAX_RECIPIENTS_PER_CAMPAIGN: numberEnv(
      'MAX_RECIPIENTS_PER_CAMPAIGN',
      20,
      1,
      50,
    ),
    MAX_ATTACHMENT_SIZE_MB: numberEnv(
      'MAX_ATTACHMENT_SIZE_MB',
      10,
      1,
      25,
    ),
  };
}
