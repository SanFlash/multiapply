import { redirect } from 'next/navigation';
import { getSession, setSession } from '@/lib/session';
import { authEnv } from '@/lib/config';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getSession()) redirect('/dashboard');

  const e = authEnv();
  const params = await searchParams;

  async function login(formData: FormData) {
    'use server';

    const email = String(formData.get('email') || '').trim().toLowerCase();
    const password = String(formData.get('password') || '');
    const auth = authEnv();

    if (
      email !== auth.ADMIN_EMAIL.toLowerCase() ||
      password !== auth.ADMIN_PASSWORD
    ) {
      redirect('/?error=1');
    }

    await setSession({
      email: auth.ADMIN_EMAIL,
      name: process.env.BREVO_SENDER_NAME || 'MultiApply',
      authenticated: true,
    });

    redirect('/dashboard');
  }

  return (
    <main className="shell">
      <div className="container login-container">
        <section className="hero">
          <div className="brand">Multi<span>Apply</span></div>
          <h1>
            Send individual emails.
            <br />
            From any device.
          </h1>
          <p>
            Login once, paste your recipients, add your message and attachments,
            then send each recipient a separate email.
          </p>
        </section>

        <form className="card stack login-card" action={login}>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              className="input"
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              defaultValue={e.ADMIN_EMAIL}
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

          {params.error ? (
            <p className="error">Incorrect email or password.</p>
          ) : null}

          <button className="btn primary" type="submit">
            Login &amp; Start
          </button>

          <p className="muted small">
            You only need to login once per browser session. Your Brevo API key
            stays on the server.
          </p>
        </form>
      </div>
    </main>
  );
}
