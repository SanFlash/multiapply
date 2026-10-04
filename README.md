# MultiApply — Mobile Email Sender

MultiApply is a mobile-first Next.js application for sending one **separate email per recipient** through a connected Gmail account.

## Features
- Google OAuth 2.0 + Gmail API
- Individual delivery; no CC/BCC recipient exposure
- Comma/newline/space/semicolon recipient parsing
- Duplicate removal and validation
- Multiple attachments with per-file size validation
- Campaign result reporting
- Optional Supabase campaign history
- Responsive phone/tablet/desktop UI
- Server-only credentials and encrypted HttpOnly session
- Vercel-compatible Node.js Route Handlers

## Important limits
This is not an unlimited-mail service. Gmail/Google, Vercel and Supabase impose quotas, request limits, execution limits and storage limits. The app does not bypass or evade those controls.

## Run locally
Requirements: Node.js 20+.

```bash
npm install
cp .env.example .env.local
npm run typecheck
npm test
npm run build
npm run dev
```

PowerShell:
```powershell
Copy-Item .env.example .env.local
```

Open http://localhost:3000.

## Google OAuth setup
1. Create/select a Google Cloud project.
2. Enable **Gmail API**.
3. Configure the OAuth consent screen.
4. Create OAuth credentials of type **Web application**.
5. Add local redirect URI: `http://localhost:3000/api/auth/callback/google`.
6. After deployment add: `https://YOUR-DOMAIN/api/auth/callback/google`.
7. Put the client ID, secret and redirect URI in your environment variables.
8. The app requests OpenID/email/profile plus `https://www.googleapis.com/auth/gmail.send`.

## Environment variables
See `.env.example`. Required for sending:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `SESSION_SECRET`

Optional persistent history:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Operational settings:
- `EMAIL_DELAY_MS`
- `MAX_RECIPIENTS_PER_CAMPAIGN`
- `MAX_ATTACHMENT_SIZE_MB`

Never expose service credentials with `NEXT_PUBLIC_`. Never commit `.env.local`, refresh tokens or credential JSON files.

## Supabase
Run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor. The app uses the server-only service-role key for campaign history. If Supabase is not configured, sending still works but persistent history is unavailable.

## Vercel deployment
1. Import `SanFlash/multiapply` into Vercel.
2. Select Next.js.
3. Add all required production environment variables.
4. Set `NEXT_PUBLIC_APP_URL` to the production URL.
5. Set `GOOGLE_REDIRECT_URI` to the exact production callback URL.
6. Add the exact callback URL in Google Cloud.
7. Deploy/redeploy.

The send route uses the Node.js runtime and a bounded function duration. Large campaigns can still be constrained by Vercel execution limits and Gmail quotas.

## Sending flow
```
Browser
  -> Next.js /api/email/send
  -> validate recipients + attachments
  -> create campaign (optional Supabase)
  -> Gmail API: recipient #1
  -> Gmail API: recipient #2
  -> ...
  -> update campaign status
```

Every recipient is an independent Gmail message. No other recipient address is included.

## Security
- OAuth instead of storing Gmail passwords.
- OAuth state is checked to prevent login CSRF.
- Session is encrypted and stored in an HttpOnly cookie.
- Service credentials are server-only.
- Recipient input and attachments are validated.
- Current composer safely derives simple HTML from plain text.
- Attachment filenames are sanitized.
- Provider quotas are respected.

## Testing
```bash
npm run typecheck
npm test
npm run build
```

## Troubleshooting
### redirect_uri_mismatch
The URI must exactly match the Google Cloud credential and `GOOGLE_REDIRECT_URI`.

### 401/403 from Gmail
Reconnect the account and verify Gmail API is enabled and the requested OAuth scope is permitted.

### 429/quota errors
Wait/reduce rate or use an appropriate provider configuration. Do not bypass quotas.

### Vercel environment errors
Add variables to the correct Vercel environment and redeploy.

## Project structure
```
app/                 Next.js pages and API routes
components/          React UI
lib/                 OAuth, Gmail, sessions, validation, persistence
supabase/migrations/ Database schema
tests/               Unit tests
```
