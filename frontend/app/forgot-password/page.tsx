'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { authApi } from '../../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process the request right now.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl items-center px-4 py-12">
      <section className="w-full rounded-[28px] border border-[var(--beige)] bg-[var(--warm-white)] p-6 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-sage)]">Account access</p>
        <h1 className="mt-2 font-serif text-3xl text-[var(--charcoal)]">Forgot password</h1>
        {submitted ? <p role="status" className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">If an account exists for that email, a password reset link will be sent.</p> : (
          <form onSubmit={submit} className="mt-6 space-y-5">
            <p className="text-sm text-[var(--text-muted)]">Enter your account email and we’ll send a reset link if it matches an account.</p>
            <label className="block text-sm font-medium text-[var(--charcoal)]">Email<input type="email" required maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-2xl border border-[var(--beige)] bg-white px-4 py-3 outline-none focus:border-[var(--accent-sage)]" /></label>
            {error ? <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
            <button type="submit" disabled={isSubmitting} className="w-full rounded-2xl bg-[var(--charcoal)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{isSubmitting ? 'Sending...' : 'Send reset link'}</button>
          </form>
        )}
        <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-[var(--brown-dark)] underline-offset-4 hover:underline">Back to log in</Link>
      </section>
    </main>
  );
}
