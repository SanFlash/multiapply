import { redirect } from 'next/navigation';
import { getSession, clearSession } from '@/lib/session';
import { history } from '@/lib/store';
import Compose from '@/components/Compose';

export default async function Dashboard() {
  const s = await getSession();
  if (!s) redirect('/');

  const h = await history(s.email);

  async function logout() {
    'use server';
    await clearSession();
    redirect('/');
  }

  return (
    <main className="shell dashboard-shell">
      <nav className="nav">
        <div className="brand">Multi<span>Apply</span></div>
        <div className="account-bar">
          <span className="account-email">{s.email}</span>
          <form action={logout}>
            <button className="btn logout-btn" type="submit">Log out</button>
          </form>
        </div>
      </nav>

      <div className="container dashboard-container">
        <section className="dashboard-hero">
          <div>
            <span className="eyebrow">APPLICATION WORKSPACE</span>
            <h1>Send your QA application.</h1>
            <p>Subject and message are ready. Add recruiters and your resume, then send individually.</p>
          </div>
          <div className="hero-badge">✓ Ready to send</div>
        </section>

        <div className="mobile-steps">
          <span>1. Recipients</span><span>2. Resume</span><span>3. Send</span>
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
              <span className="history-count">{h.length}</span>
            </div>
            {h.length ? (
              <div className="history-list">
                {h.map((x: any) => (
                  <div className="history-item" key={x.id}>
                    <div className="history-subject">{x.subject}</div>
                    <div className="history-meta">
                      <span className="success">✓ {x.successful_count || 0} sent</span>
                      <span className="error">✕ {x.failed_count || 0} failed</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty">Your completed campaigns will appear here.</div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
