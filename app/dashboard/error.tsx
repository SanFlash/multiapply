'use client';

import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('MultiApply dashboard error:', error);
  }, [error]);

  return (
    <main className="shell dashboard-shell">
      <div className="container dashboard-container">
        <section className="card stack" style={{ marginTop: 40 }}>
          <span className="eyebrow">MULTIAPPLY</span>
          <h1>Workspace temporarily unavailable</h1>
          <p className="muted">
            The dashboard hit an unexpected error. Your login and email data
            have not been changed.
          </p>
          {error?.digest ? (
            <p className="muted small">Reference: {error.digest}</p>
          ) : null}
          <div className="row">
            <button className="btn primary" type="button" onClick={reset}>
              Try again
            </button>
            <a className="btn" href="/">
              Back to login
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
