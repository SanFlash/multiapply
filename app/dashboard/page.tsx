'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const Compose = dynamic(() => import('@/components/Compose'), {
  ssr: false,
  loading: () => (
    <div className="card stack" aria-busy="true">
      <span className="eyebrow">COMPOSER</span>
      <h2>Preparing your application form…</h2>
      <p className="muted">Loading the email workspace securely.</p>
    </div>
  ),
});

type Session = {
  email: string;
  name?: string;
  authenticated: true;
};

export default function Dashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSession() {
      try {
        const response = await fetch('/api/auth/session', {
          cache: 'no-store',
          credentials: 'same-origin',
          signal: controller.signal,
        });

        if (!response.ok) {
          window.location.replace('/');
          return;
        }

        const data = (await response.json()) as { session?: Session };

        if (data.session?.authenticated === true && data.session.email) {
          setSession(data.session);
          return;
        }

        window.location.replace('/');
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        window.location.replace('/');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadSession();

    return () => controller.abort();
  }, []);

  async function logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } finally {
      window.location.replace('/');
    }
  }

  if (loading) {
    return (
      <main className="shell dashboard-shell">
        <div className="container dashboard-container">
          <div className="card" style={{ marginTop: 40 }}>
            <span className="eyebrow">MULTIAPPLY</span>
            <h2>Loading workspace…</h2>
            <p className="muted">Checking your secure session.</p>
          </div>
        </div>
      </main>
    );
  }

  if (!session) return null;

  return (
    <main className="shell dashboard-shell">
      <nav className="nav">
        <div className="brand">
          Multi<span>Apply</span>
        </div>
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
              Subject and message are ready. Add recruiters and your resume,
              then send individually.
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
          <section className="compose-panel">
            <Compose />
          </section>

          <aside className="history-panel card">
            <div className="history-heading">
              <div>
                <span className="eyebrow">HISTORY</span>
                <h2>Recent campaigns</h2>
              </div>
              <span className="history-count">0</span>
            </div>
            <div className="empty">
              Campaign history will be available once optional database storage
              is configured.
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
