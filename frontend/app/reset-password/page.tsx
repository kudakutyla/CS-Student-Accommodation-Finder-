'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '../../lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!token) {
      setError('This password reset link is invalid or expired.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      router.replace('/login?passwordReset=success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset your password.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl items-center px-4 py-12">
      <section className="w-full rounded-[28px] border border-[var(--beige)] bg-[var(--warm-white)] p-6 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-sage)]">Account access</p>
        <h1 className="mt-2 font-serif text-3xl text-[var(--charcoal)]">Set a new password</h1>
        <form onSubmit={submit} className="mt-6 space-y-5">
          <label className="block text-sm font-medium text-[var(--charcoal)]">New password<input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-2xl border border-[var(--beige)] bg-white px-4 py-3 outline-none focus:border-[var(--accent-sage)]" /></label>
          <label className="block text-sm font-medium text-[var(--charcoal)]">Confirm new password<input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-2 w-full rounded-2xl border border-[var(--beige)] bg-white px-4 py-3 outline-none focus:border-[var(--accent-sage)]" /></label>
          {error ? <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
          <button type="submit" disabled={isSubmitting} className="w-full rounded-2xl bg-[var(--charcoal)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{isSubmitting ? 'Updating...' : 'Reset password'}</button>
        </form>
        <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-[var(--brown-dark)] underline-offset-4 hover:underline">Back to log in</Link>
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<p className="px-4 py-12 text-center text-sm text-[var(--text-muted)]">Loading reset form...</p>}><ResetPasswordForm /></Suspense>;
}
