# Architecture Notes

1. Browser submits compose data to the server-side Next.js Route Handler.
2. The server validates and normalizes recipients.
3. An optional campaign is persisted in Supabase.
4. One recipient record is created per email address when Supabase is enabled.
5. Attachments are held in memory for the duration of the send request and encoded as base64 for Brevo.
6. The server sends each recipient as an independent Brevo transactional email.
7. Provider limits are respected and a configurable delay is used between recipient sends.
8. Recipient and campaign statuses are updated after each attempt when Supabase is enabled.
9. The UI displays the completed campaign result and can query campaign status.
10. Brevo transactional logs/webhooks can be used for provider-level delivery events.

Never expose the Brevo API key or Supabase service key to the client.
