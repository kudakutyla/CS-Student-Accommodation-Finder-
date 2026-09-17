'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT' as 'STUDENT' | 'LANDLORD',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role,
      });

      if (user.role === 'LANDLORD') router.push('/landlord/dashboard');
      else router.push('/student/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create your account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="rounded-[28px] border border-[var(--beige)] bg-[var(--warm-white)] p-6 shadow-[0_20px_50px_rgba(92,74,56,0.08)] sm:p-10">
        <div className="mb-8 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-sage)]">Create account</p>
            <h1 className="mt-2 font-serif text-3xl text-[var(--charcoal)]">Join Abode</h1>
          </div>
          <Link href="/login" className="text-sm font-medium text-[var(--brown-dark)] underline-offset-4 hover:underline">Already have an account?</Link>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">I am joining as</label>
            <div className="grid gap-3 sm:grid-cols-2">
              {(['STUDENT', 'LANDLORD'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleChange('role', role)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${form.role === role ? 'border-[var(--accent-sage)] bg-[var(--cream)] text-[var(--charcoal)]' : 'border-[var(--beige)] bg-white text-[var(--text-muted)] hover:border-[var(--sand)]'}`}
                >
                  {role === 'STUDENT' ? 'Student' : 'Landlord'}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Full name</label>
            <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full rounded-2xl border border-[var(--beige)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent-sage)]" placeholder="Enter your full name" required />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Email</label>
            <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full rounded-2xl border border-[var(--beige)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent-sage)]" placeholder="you@example.com" required />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Phone</label>
            <input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className="w-full rounded-2xl border border-[var(--beige)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent-sage)]" placeholder="+27 71 123 4567" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Password</label>
            <input type="password" value={form.password} onChange={(e) => handleChange('password', e.target.value)} className="w-full rounded-2xl border border-[var(--beige)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent-sage)]" placeholder="Create a password" required />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Confirm password</label>
            <input type="password" value={form.confirmPassword} onChange={(e) => handleChange('confirmPassword', e.target.value)} className="w-full rounded-2xl border border-[var(--beige)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent-sage)]" placeholder="Repeat your password" required />
          </div>

          {error ? <div className="md:col-span-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

          <div className="md:col-span-2">
            <button type="submit" disabled={isSubmitting} className="w-full rounded-2xl bg-[var(--charcoal)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--charcoal-mid)] disabled:cursor-not-allowed disabled:opacity-70">
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
