import { redirect } from 'next/navigation';
import { getSession, setSession } from '@/lib/session';
import { authEnv } from '@/lib/config';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getSession()) redirect('/dashboard');

  let auth: ReturnType<typeof authEnv> | null = null;
  let setupError = false;

  try {
    auth = authEnv();
  } catch {
    setupError = true;
  }

  const params = await searchParams;

  async function login(formData: FormData) {
    'use server';

    const authConfig = authEnv();
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const password = String(formData.get('password') || '');

    if (
      email !== authConfig.ADMIN_EMAIL.toLowerCase() ||
      password !== authConfig.ADMIN_PASSWORD
    ) {
      redirect('/?error=1');
    }

    await setSession({
      email: authConfig.ADMIN_EMAIL,
      name: process.env.BREVO_SENDER_NAME || 'MultiApply',
      authenticated: true,
    });

    redirect('/dashboard');
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

        {setupError ? (
          <section className="card setup-card">
            <h2>Almost ready</h2>
            <p className="muted">
              Vercel is missing one or more login environment variables.
              Add ADMIN_EMAIL, ADMIN_PASSWORD and SESSION_SECRET, then redeploy.
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
                defaultValue={auth?.ADMIN_EMAIL || ''}
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
