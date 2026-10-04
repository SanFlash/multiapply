import { redirect } from 'next/navigation';
import { getSession, setSession } from '@/lib/session';

function readAuthConfig() {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.SESSION_SECRET?.trim();

  if (!email || !password || password.length < 8 || !secret || secret.length < 32) {
    return null;
  }

  return { email: email.toLowerCase(), password };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; setup?: string }>;
}) {
  if (await getSession()) redirect('/dashboard');

  const auth = readAuthConfig();
  const params = await searchParams;

  async function login(formData: FormData) {
    'use server';

    const authConfig = readAuthConfig();

    if (!authConfig) {
      redirect('/?setup=1');
    }

    const email = String(formData.get('email') || '').trim().toLowerCase();
    const password = String(formData.get('password') || '');

    if (email !== authConfig.email || password !== authConfig.password) {
      redirect('/?error=1');
    }

    try {
      await setSession({
        email: authConfig.email,
        name: process.env.BREVO_SENDER_NAME?.trim() || 'MultiApply',
        authenticated: true,
      });
    } catch {
      redirect('/?setup=1');
    }

    redirect('/dashboard');
  }

  const setupError = !auth || params.setup === '1';

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

        {setupError ? (
          <section className="card setup-card">
            <h2>Almost ready</h2>
            <p className="muted">
              Login configuration is incomplete. In Vercel, add ADMIN_EMAIL,
              ADMIN_PASSWORD and a SESSION_SECRET with at least 32 characters,
              then redeploy.
            </p>
            <p className="muted">
              The page itself is working; this message means the server cannot
              authenticate until those values are configured.
            </p>
          </section>
        ) : (
          <form className="card stack login-card" action={login}>
            <div>
              <label className="label" htmlFor="email">Login email</label>
              <input
                className="input"
                id="email"
                name="email"
                type="email"
                required
                autoComplete="username"
                defaultValue={auth.email}
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
              />
            </div>
            {params.error ? <p className="error">Incorrect email or password.</p> : null}
            <button className="btn primary login-submit" type="submit">
              Login &amp; Start
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
