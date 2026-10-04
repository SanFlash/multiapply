'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_SUBJECT =
  'Application for QA / QA Automation Opportunities – Satyendra Kumar Namdeo';

const DEFAULT_BODY = [
  'Dear Hiring Team,',
  '',
  'I hope you’re doing well.',
  '',
  'I am writing to explore QA / QA Automation opportunities with your organization. I am currently working as a QA Engineer at AM Webtech, with hands-on experience in functional testing, automation, web and mobile application testing.',
  '',
  'My technical experience includes Python, Playwright, Appium, Pytest, API testing, POM, and GitHub Actions, along with exposure to AI-assisted testing and automation. I also actively build automation projects to improve test reliability, coverage, and efficiency.',
  '',
  'I would appreciate the opportunity to be considered for any QA, QA Automation, Software Testing, or SDET roles that match my profile.',
  '',
  'Portfolio: https://satyendranamdeo.co.in',
  'GitHub: https://github.com/SanFlash',
  'LinkedIn: https://www.linkedin.com/in/satyendra-namdeo/',
  '',
  'I have attached my resume for your consideration and would be happy to discuss my experience or participate in an assessment/interview.',
  '',
  'Thank you for your time and consideration. I look forward to hearing from you.',
  '',
  'Best regards,',
  'Satyendra Kumar Namdeo',
  'QA Engineer | QA Automation',
  'Bhopal, Madhya Pradesh, India',
].join('\n');

export default function Compose() {
  const [recipients, setRecipients] = useState('');
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [job, setJob] = useState<any>(null);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('multiapply-recipients');
    if (saved) setRecipients(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('multiapply-recipients', recipients);
  }, [recipients]);

  const count = useMemo(
    () => recipients.split(/[\s,;]+/).filter(Boolean).length,
    [recipients],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setJob(null);
    setError('');

    try {
      const fd = new FormData();
      fd.append('recipients', recipients);
      fd.append('subject', subject);
      fd.append('bodyText', body);
      fd.append(
        'bodyHtml',
        body
          .split('\n')
          .map(
            (line) =>
              '<p>' +
              line
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;') +
              '</p>',
          )
          .join(''),
      );

      files.forEach((file) => fd.append('attachments', file));

      const response = await fetch('/api/email/send', {
        method: 'POST',
        body: fd,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to start sending');
      }

      setJob(data);

      const timer = window.setInterval(async () => {
        try {
          const statusResponse = await fetch(
            '/api/email/status?id=' + encodeURIComponent(data.jobId),
            { cache: 'no-store' },
          );
          const status = await statusResponse.json();
          setJob((current) => ({ ...current, ...status }));

          if (status.status === 'completed') {
            window.clearInterval(timer);
            setSending(false);
          }
        } catch {
          // Keep the initial result visible if polling temporarily fails.
        }
      }, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send emails');
      setSending(false);
    }
  }

  return (
    <form className="card stack" onSubmit={submit}>
      <div>
        <label className="label" htmlFor="recipients">
          Recipients
        </label>
        <textarea
          className="textarea"
          id="recipients"
          style={{ minHeight: 110 }}
          value={recipients}
          onChange={(e) => setRecipients(e.target.value)}
          placeholder="person@example.com, another@example.com"
        />
        <div className="muted">
          {count} address{count === 1 ? '' : 'es'} detected. Separate with
          commas, spaces, semicolons, or new lines.
        </div>
      </div>

      <div>
        <label className="label" htmlFor="subject">
          Subject
        </label>
        <input
          className="input"
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="body">
          Message
        </label>
        <textarea
          className="textarea"
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          style={{ minHeight: 360 }}
          required
        />
      </div>

      <div>
        <label className="label">Attachments</label>
        <input
          ref={input}
          hidden
          type="file"
          multiple
          accept=".pdf,.doc,.docx"
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
        />

        <div className="row">
          <button
            type="button"
            className="btn"
            onClick={() => input.current?.click()}
          >
            📎 Attach Resume
          </button>
          <span className="muted small">
            Select SatyendraNamdeoResumeQA.pdf
          </span>
        </div>

        {files.map((file, index) => (
          <div className="file" key={file.name + index}>
            <span>
              📎 {file.name}{' '}
              <span className="muted">
                ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </span>
            <button
              type="button"
              className="btn danger"
              onClick={() => setFiles(files.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {error ? <div className="error">{error}</div> : null}

      <button
        className="btn primary"
        disabled={sending || !recipients.trim() || !subject.trim() || !body.trim()}
        type="submit"
      >
        {sending ? 'Sending…' : 'Send individual emails'}
      </button>

      {job ? (
        <div className="card">
          <h3>
            {job.status === 'completed' ? 'Campaign completed' : 'Sending…'}
          </h3>
          {job.total ? (
            <>
              <div className="progress">
                <i
                  style={{
                    width:
                      Math.min(
                        100,
                        (((job.sent || 0) + (job.failed || 0)) / job.total) * 100,
                      ) + '%',
                  }}
                />
              </div>
              <p>
                {(job.sent || 0) + (job.failed || 0)} / {job.total} processed
              </p>
              <p className="success">✓ {job.sent || 0} sent</p>
              <p className="error">✕ {job.failed || 0} failed</p>
              {job.invalid?.length ? (
                <p className="error">Invalid: {job.invalid.join(', ')}</p>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
