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

type Session = {
  email: string;
  name?: string;
  authenticated: true;
};

type JobResult = {
  email: string;
  status: string;
  messageId?: string;
  error?: string;
};

type Job = {
  jobId: string;
  status: string;
  total?: number;
  sent?: number;
  failed?: number;
  invalid?: string[];
  results?: JobResult[];
};

export default function Dashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [recipients, setRecipients] = useState('');
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState('');
  const [resumeReady, setResumeReady] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDefaultResume() {
      try {
        const response = await fetch('/api/resume', {
          cache: 'no-store',
          credentials: 'same-origin',
        });

        if (!response.ok) throw new Error('Default resume not found');

        const blob = await response.blob();
        const resume = new File(
          [blob],
          'Satyendra_Kumar_Namdeo_Resume.pdf',
          { type: 'application/pdf' },
        );

        if (!cancelled) {
          setFiles([resume]);
          setResumeReady(true);
        }
      } catch {
        if (!cancelled) setResumeReady(false);
      }
    }

    loadDefaultResume();

    const saved = localStorage.getItem('multiapply-recipients');
    if (saved) setRecipients(saved);

    fetch('/api/auth/session', {
      cache: 'no-store',
      credentials: 'same-origin',
    })
      .then(async (response) => {
        if (!response.ok) {
          window.location.replace('/');
          return;
        }

        const data = await response.json();

        if (data.session?.authenticated === true) {
          setSession(data.session);
        } else {
          window.location.replace('/');
        }
      })
      .catch(() => window.location.replace('/'))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    localStorage.setItem('multiapply-recipients', recipients);
  }, [recipients]);

  const count = useMemo(
    () => recipients.split(/[\s,;]+/).filter(Boolean).length,
    [recipients],
  );

  async function logout() {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
    }).catch(() => undefined);
    window.location.replace('/');
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setJob(null);
    setError('');

    try {
      const form = new FormData();
      form.append('recipients', recipients);
      form.append('subject', subject);
      form.append('bodyText', body);
      form.append(
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

      files.forEach((file) => form.append('attachments', file));

      const response = await fetch('/api/email/send', {
        method: 'POST',
        body: form,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to send campaign');
      }

      setJob(data);
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Unable to send campaign');
    } finally {
      setSending(false);
    }
  }

  if (checking) {
    return (
      <main className="shell dashboard-shell">
        <div className="container dashboard-container">
          <section className="card" style={{ marginTop: 40 }}>
            <span className="eyebrow">MULTIAPPLY</span>
            <h2>Loading workspace…</h2>
            <p className="muted">Checking your secure session.</p>
          </section>
        </div>
      </main>
    );
  }

  if (!session) return null;

  return (
    <main className="shell dashboard-shell">
      <nav className="nav">
        <div className="brand">Multi<span>Apply</span></div>
        <div className="account-bar">
          <span className="account-email">{session.email}</span>
          <button className="btn logout-btn" type="button" onClick={logout}>
            Log out
          </button>
        </div>
      </nav>

      <div className="container dashboard-container">
        <section className="dashboard-hero">
          <div>
            <span className="eyebrow">APPLICATION WORKSPACE</span>
            <h1>Send your QA application.</h1>
            <p>
              Add recruiter addresses, review your message, attach your resume,
              and send each application individually.
            </p>
          </div>
          <div className="hero-badge">✓ Ready to send</div>
        </section>

        <div className="mobile-steps">
          <span>1. Recipients</span>
          <span>2. Resume</span>
          <span>3. Send</span>
        </div>

        <div className="dashboard-grid">
          <form className="card stack compose-panel" onSubmit={submit}>
            <div>
              <label className="label" htmlFor="recipients">Recipients</label>
              <textarea
                className="textarea"
                id="recipients"
                value={recipients}
                onChange={(event) => setRecipients(event.target.value)}
                placeholder="person@example.com, another@example.com"
                style={{ minHeight: 110 }}
              />
              <div className="muted">
                {count} address{count === 1 ? '' : 'es'} detected.
              </div>
            </div>

            <div>
              <label className="label" htmlFor="subject">Subject</label>
              <input
                className="input"
                id="subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="body">Message</label>
              <textarea
                className="textarea"
                id="body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                style={{ minHeight: 360 }}
                required
              />
            </div>

            <div>
              <label className="label">Resume attachment</label>
              <input
                ref={input}
                hidden
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(event) =>
                  setFiles(Array.from(event.target.files || []))
                }
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
                  {resumeReady
                    ? 'Default project resume loaded automatically.'
                    : 'PDF, DOC or DOCX'}
                </span>
              </div>

              {files.map((file) => (
                <div className="file" key={file.name}>
                  <span>
                    📎 {file.name}{' '}
                    <span className="muted">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </span>
                  <button
                    type="button"
                    className="btn danger"
                    onClick={() => setFiles([])}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {error ? <div className="error">{error}</div> : null}

            <button
              className="btn primary"
              disabled={
                sending ||
                !recipients.trim() ||
                !subject.trim() ||
                !body.trim()
              }
              type="submit"
            >
              {sending ? 'Sending…' : 'Send individual emails'}
            </button>

            {job ? (
              <div className="card">
                <h3>Campaign completed</h3>
                <p>{job.sent || 0} sent · {job.failed || 0} failed</p>
                {job.invalid?.length ? (
                  <p className="error">Invalid: {job.invalid.join(', ')}</p>
                ) : null}
                {job.results?.filter((result) => result.status === 'failed').map((result) => (
                  <div className="error" key={result.email} style={{ marginTop: 8 }}>
                    <strong>{result.email}</strong>
                    <div>{result.error || 'Brevo rejected this email.'}</div>
                  </div>
                ))}
                {job.results?.filter((result) => result.status === 'sent').map((result) => (
                  <div key={result.email} style={{ marginTop: 8 }}>✓ {result.email}</div>
                ))}
              </div>
            ) : null}
          </form>

          <aside className="history-panel card">
            <div className="history-heading">
              <div>
                <span className="eyebrow">HISTORY</span>
                <h2>Recent campaigns</h2>
              </div>
              <span className="history-count">0</span>
            </div>
            <div className="empty">
              Campaign history is optional and will appear here when database
              storage is configured.
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
