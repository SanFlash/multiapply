# Architecture Notes

1. Browser submits compose data to server-side Route Handlers.
2. Server validates and normalizes recipients.
3. A campaign is persisted in Supabase.
4. One recipient record/job is created per email address.
5. Attachments are stored temporarily in object storage.
6. Server-side Gmail provider sends each recipient independently.
7. Provider limits are respected; transient failures use bounded exponential backoff.
8. Recipient and campaign statuses are updated after every attempt.
9. UI polls/refreshes campaign status and displays sent/failed counts.
10. Temporary attachment objects are removed after the campaign when safe.

Never expose OAuth credentials or tokens to the client.
