'use client';

import { FormEvent, useState } from 'react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [setup, setSetup] = useState(false);
  const [loading, setLoading] = useState(false);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSetup(false);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 503) {
        setSetup(true);
        return;
      }

      if (!response.ok) {
        setError(data.error || 'Incorrect email or password.');
        return;
      }

      window.location.replace('/dashboard');
    } catch {
      setError('Unable to reach the login service. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell login-shell">
      <div className="login-container">
        <section className="login-hero">
          <div className="brand">Multi<span>Apply</span></div>
          <span className="eyebrow">QA APPLICATION MAILER</span>
          <h1>Apply faster.<br />One message at a time.</h1>
          <p>
            Prepare your application once, attach your resume, paste recruiter
            addresses and send each message individually.
          </p>
        </section>

        {setup ? (
          <section className="card setup-card">
            <h2>Almost ready</h2>
            <p className="muted">
              Login configuration is incomplete. In Vercel, add ADMIN_EMAIL,
              ADMIN_PASSWORD and a SESSION_SECRET with at least 32 characters,
              then redeploy.
            </p>
          </section>
        ) : (
          <form className="card stack login-card" onSubmit={login}>
            <div>
              <label className="label" htmlFor="email">Login email</label>
              <input
                className="input"
                id="email"
                name="email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                className="input"
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                autoFocus
                placeholder="Enter your MultiApply password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error ? <p className="error">{error}</p> : null}
            <button className="btn primary login-submit" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Login & Start'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
