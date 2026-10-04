# MultiApply — Brevo Email Sender

MultiApply is a mobile-first Next.js application for sending one **separate email per recipient** through Brevo's transactional email API.

## Architecture

```
Browser
  -> MultiApply admin login
  -> Next.js /api/email/send
  -> Brevo API
  -> recipient #1
  -> recipient #2
  -> ...
```

There is **no Google OAuth and no Gmail API** in this version.

## Features

- Brevo transactional email API
- Simple encrypted admin session
- Individual delivery with no CC/BCC recipient exposure
- Recipient validation and duplicate removal
- Multiple attachments with size limits
- Campaign progress and result reporting
- Optional Supabase campaign history
- Responsive phone/tablet/desktop UI
- Server-only Brevo API key
- Vercel-compatible Node.js route handlers
- `/api/health` endpoint for Brevo connectivity

Brevo's send endpoint is `POST https://api.brevo.com/v3/smtp/email`. Authentication uses the `api-key` header, and attachments can be sent as base64 content. citeturn0search0turn0search1

## 1. Create and configure Brevo

1. Create/sign in to Brevo.
2. Open **Settings -> SMTP & API -> API Keys**.
3. Generate a new API key.
4. Copy it immediately and keep it secret.
5. Configure and verify the sender email/domain you want to use.
6. Use that verified address as `BREVO_SENDER_EMAIL`.

Brevo specifically recommends keeping API keys secret and using them in the `api-key` request header. citeturn0search2

## 2. Local setup

Requirements: Node.js 20+.

PowerShell:

```powershell
git clone https://github.com/SanFlash/multiapply.git
cd multiapply
npm install
Copy-Item .env.example .env.local
```

Edit `.env.local`:

```env
ADMIN_EMAIL=your-login-email@example.com
ADMIN_PASSWORD=use-a-long-random-password
SESSION_SECRET=generate-a-random-secret-at-least-32-characters

BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxx
BREVO_SENDER_EMAIL=your-verified-sender@example.com
BREVO_SENDER_NAME=Satyendra
BREVO_REPLY_TO_EMAIL=your-reply-address@example.com
BREVO_REPLY_TO_NAME=Satyendra

EMAIL_DELAY_MS=500
MAX_RECIPIENTS_PER_CAMPAIGN=50
MAX_ATTACHMENT_SIZE_MB=10
```

Generate a session secret in PowerShell:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Then:

```powershell
npm run typecheck
npm test
npm run build
npm run dev
```

Open http://localhost:3000.

## 3. Login

Use the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env.local`.

The application creates an encrypted HttpOnly session cookie after successful login.

## 4. Test Brevo

Open:

```
http://localhost:3000/api/health
```

A valid configuration should return a successful Brevo connection.

For integration testing without actually delivering mail, Brevo documents a sandbox mode using the `X-Sib-Sandbox: drop` header. MultiApply's normal send path does not enable sandbox mode. citeturn0search13

## 5. Send your first email

Start with one email address that you control.

1. Enter one recipient.
2. Enter a subject.
3. Enter your message.
4. Optionally attach your resume.
5. Click **Send individual emails**.
6. Confirm delivery.
7. Check Brevo's transactional logs if needed.

Then test several recipients. MultiApply sends a separate Brevo API request for each recipient, so the recipient list is never put into CC/BCC.

## 6. Attachments

Attachments are converted to base64 on the server and sent to Brevo.

The application currently limits:
- Each attachment: `MAX_ATTACHMENT_SIZE_MB`
- Combined attachments: 20 MB
- Campaign recipients: `MAX_RECIPIENTS_PER_CAMPAIGN`

For larger files or campaigns, use a durable storage/queue architecture instead of increasing limits blindly.

## 7. Optional Supabase history

Sending does not require Supabase.

If you want persistent campaign history:

1. Create a Supabase project.
2. Run `supabase/migrations/001_initial_schema.sql`.
3. Add:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_KEY
```

Never expose the service key through a `NEXT_PUBLIC_*` variable.

## 8. Deploy to Vercel

Import `SanFlash/multiapply` into Vercel.

Add these production environment variables:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- optional `BREVO_REPLY_TO_EMAIL`
- optional `BREVO_REPLY_TO_NAME`
- optional `SUPABASE_URL`
- optional `SUPABASE_SERVICE_ROLE_KEY`
- `EMAIL_DELAY_MS`
- `MAX_RECIPIENTS_PER_CAMPAIGN`
- `MAX_ATTACHMENT_SIZE_MB`

Redeploy after adding or changing environment variables.

There is **no Google redirect URI** to configure.

## Sending limits

This application does not bypass Brevo, Vercel, or account limits.

Brevo provides a separate batch transactional endpoint for larger API operations, with documented limits including up to 1,000 personalized message versions per request. MultiApply currently uses one request per recipient because this keeps per-recipient status and privacy straightforward. citeturn0search6

For large campaigns, the next architectural upgrade should be a durable queue/background worker rather than a single Vercel request.

## Security

- Brevo API key stays server-side.
- Admin session is encrypted and HttpOnly.
- No Gmail passwords, OAuth refresh tokens, or Google credentials are required.
- Recipient addresses are sent independently.
- Attachment filenames are sanitized.
- Attachment sizes are validated.
- `.env.local` must never be committed.

## Troubleshooting

### Brevo 401/403

Check `BREVO_API_KEY` and verify that the sender is configured in Brevo.

### Sender rejected

Use the exact sender email that Brevo has verified/configured.

### Attachment rejected

Reduce attachment size and keep the combined request below the application's configured limit.

### Campaign stops early

Vercel functions have execution limits. Keep campaigns reasonably sized. For larger campaigns, add a durable queue/worker.

### History is empty

Configure Supabase and run the migration. Without Supabase, sending still works but campaign history is not durable.

## Scripts

```powershell
npm run dev
npm run typecheck
npm test
npm run build
```
