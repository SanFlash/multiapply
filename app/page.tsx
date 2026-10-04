import { redirect } from 'next/navigation';
import { getSession, setSession } from '@/lib/session';
import { env } from '@/lib/config';

export default async function Home() {
  if (await getSession()) redirect('/dashboard');
  async function login(formData: FormData) {
    'use server';
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const password = String(formData.get('password') || '');
    const e = env();
    if (email !== e.ADMIN_EMAIL.toLowerCase() || password !== e.ADMIN_PASSWORD) redirect('/?error=1');
    await setSession({ email: e.ADMIN_EMAIL, name: e.BREVO_SENDER_NAME, authenticated: true });
    redirect('/dashboard');
  }
  return <main className="shell"><div className="container login-container">
    <section className="hero"><div className="brand">Multi<span>Apply</span></div><h1>Send individual emails.<br/>From any device.</h1><p>Compose once, add recipients and attachments, and send a separate email to every recipient through Brevo.</p></section>
    <form className="card stack login-card" action={login}>
      <div><label className="label" htmlFor="email">Admin email</label><input className="input" id="email" name="email" type="email" required autoComplete="username" placeholder="you@example.com" /></div>
      <div><label className="label" htmlFor="password">Password</label><input className="input" id="password" name="password" type="password" required autoComplete="current-password" placeholder="Your MultiApply password" /></div>
      <button className="btn primary" type="submit">Open MultiApply</button>
      <p className="muted small">Your password and Brevo API key stay on the server as environment variables.</p>
    </form>
    <div className="grid"><div className="card"><h2>Individual delivery</h2><p className="muted">Each address receives its own message. Other recipients are never exposed.</p></div><div className="card"><h2>Simple setup</h2><p className="muted">No Google Cloud project, OAuth consent screen or Gmail refresh tokens.</p></div></div>
    <div className="footer">Brevo, Vercel and your email provider still enforce their normal sending and execution limits.</div>
  </div></main>;
}