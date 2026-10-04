'use client';

import { useEffect, useState } from 'react';
import Compose from '@/components/Compose';

type Session = {
  email: string;
  name?: string;
  authenticated: true;
};

export default function Dashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetch('/api/auth/session', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('unauthorized');
        return response.json();
      })
      .then((data) => {
        if (active) setSession(data.session || null);
      })
      .catch(() => {
        if (active) window.location.replace('/');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
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
