# MultiApply — Mobile Email Sender

This repository contains the production build specification and deployment scaffold for a mobile-first email sender.

## Source specification
The requested application behavior is documented in the supplied project specification, including individual delivery per recipient, Gmail OAuth, Supabase, Vercel compatibility, attachment handling, security, testing, and README requirements.

## Current repository state
The GitHub repository was empty when inspected. No existing application source files were available to preserve or deploy.

## Intended architecture
- Next.js + React + TypeScript
- Tailwind CSS
- Gmail API + Google OAuth 2.0
- Supabase PostgreSQL
- Supabase Storage for temporary attachments
- Server-side email sending
- Individual recipient jobs (never CC/BCC bulk delivery)
- Rate limiting and retries
- Mobile-first responsive dashboard
- Campaign history and recipient-level status

## Important limitation
The application can be designed to use free-tier infrastructure without an artificial subscription fee, but sending is not technically unlimited. Vercel, Gmail/Google APIs, Supabase, and storage services enforce their own quotas and limits.

## Deployment
Target deployment: GitHub -> Vercel.

## Required environment variables
See `.env.example`.

## Security
Never commit credentials, OAuth secrets, refresh tokens, service-account files, or `.env.local`.
