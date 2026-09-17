'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('student@finder.co.za');
  const [password, setPassword] = useState('StudentPass123!');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const user = await login({ email, password });
      if (user.role === 'ADMIN') router.push('/admin/dashboard');
      else if (user.role === 'LANDLORD') router.push('/landlord/dashboard');
      else router.push('/student/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-6xl items-center justify-center px-4 py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-[var(--beige)] bg-[var(--warm-white)] shadow-[0_20px_50px_rgba(92,74,56,0.08)] lg:grid-cols-2">
        <div className="hidden bg-[radial-gradient(circle_at_top,_rgba(122,145,117,0.15),_transparent_50%),linear-gradient(135deg,#f7efe9,#f2e7df)] p-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-sage)]">Welcome back</p>
            <h1 className="mt-6 font-serif text-4xl text-[var(--charcoal)]">Find your next home with confidence.</h1>
          </div>
          <div className="rounded-3xl border border-white/60 bg-white/50 p-5 text-sm text-[var(--text-muted)] backdrop-blur-sm">
            <p className="font-semibold text-[var(--charcoal)]">Trusted by students across campus communities.</p>
            <p className="mt-2">Browse verified listings, compare prices, and connect with trusted landlords.</p>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-sage)]">Account access</p>
              <h2 className="mt-2 font-serif text-3xl text-[var(--charcoal)]">Log in</h2>
            </div>
            <Link href="/" className="text-sm font-medium text-[var(--brown-dark)] underline-offset-4 hover:underline">Back home</Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-2xl border border-[var(--beige)] bg-white px-4 py-3 outline-none ring-0 transition focus:border-[var(--accent-sage)]" placeholder="you@example.com" required />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-2xl border border-[var(--beige)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent-sage)]" placeholder="Enter your password" required />
            </div>

            {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

            <button type="submit" disabled={isSubmitting} className="w-full rounded-2xl bg-[var(--charcoal)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--charcoal-mid)] disabled:cursor-not-allowed disabled:opacity-70">
              {isSubmitting ? 'Signing in...' : 'Log in'}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-[var(--beige)] bg-[var(--cream)] p-4 text-sm text-[var(--text-muted)]">
            Need an account?{' '}
            <Link href="/register" className="font-semibold text-[var(--brown-dark)] underline-offset-4 hover:underline">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
