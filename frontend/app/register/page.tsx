'use client';

import { Suspense, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();
  const requestedRole = searchParams.get('role');
  const initialRole: 'STUDENT' | 'LANDLORD' = requestedRole === 'STUDENT' || requestedRole === 'LANDLORD'
    ? requestedRole
    : 'STUDENT';
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: initialRole,
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    <div className="mx-auto max-w-5xl px-4 py-3 sm:py-12">
      <div className="rounded-[28px] border border-[var(--beige)] bg-[var(--warm-white)] p-4 shadow-[0_20px_50px_rgba(92,74,56,0.08)] sm:p-10">
        <div className="mb-5 flex flex-col gap-2 sm:mb-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-sage)]">Create account</p>
            <h1 className="mt-1.5 font-serif text-3xl text-[var(--charcoal)] sm:mt-2">Join Abode</h1>
          </div>
          <Link href="/login" className="self-end text-sm font-medium text-[var(--brown-dark)] underline underline-offset-4 hover:underline">Already have an account?</Link>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3 sm:gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-[var(--charcoal)] sm:mb-2">I am joining as</label>
            <div className="grid grid-cols-2 gap-3">
              {(['STUDENT', 'LANDLORD'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleChange('role', role)}
                  aria-pressed={form.role === role}
                  className={`min-h-11 rounded-2xl border px-4 py-2.5 text-left text-sm font-medium transition sm:py-3 ${form.role === role ? 'border-[#4a7c5c] bg-[#4a7c5c] text-white' : 'border-[var(--beige)] bg-white text-[var(--text-muted)] hover:border-[var(--sand)]'}`}
                >
                  {role === 'STUDENT' ? 'Student' : 'Landlord'}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-[var(--charcoal)] sm:mb-2">Full name</label>
            <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full rounded-2xl border border-[var(--beige)] bg-white px-4 py-2.5 outline-none transition focus:border-[var(--accent-sage)] sm:py-3" placeholder="Enter your full name" required />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--charcoal)] sm:mb-2">Email</label>
            <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full rounded-2xl border border-[var(--beige)] bg-white px-4 py-2.5 outline-none transition focus:border-[var(--accent-sage)] sm:py-3" placeholder="you@example.com" required />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--charcoal)] sm:mb-2">Phone</label>
            <input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className="w-full rounded-2xl border border-[var(--beige)] bg-white px-4 py-2.5 outline-none transition focus:border-[var(--accent-sage)] sm:py-3" placeholder="+27 71 123 4567" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--charcoal)] sm:mb-2">Password</label>
            <div className="flex rounded-2xl border border-[var(--beige)] bg-white focus-within:border-[var(--accent-sage)]"><input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => handleChange('password', e.target.value)} className="min-h-11 min-w-0 flex-1 rounded-l-2xl bg-transparent px-4 py-2.5 outline-none sm:py-3" placeholder="Create a password" required /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)} className="px-3 text-[var(--text-muted)] hover:text-[var(--charcoal)] sm:px-4">{showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button></div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--charcoal)] sm:mb-2">Confirm password</label>
            <div className="flex rounded-2xl border border-[var(--beige)] bg-white focus-within:border-[var(--accent-sage)]"><input type={showConfirmPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => handleChange('confirmPassword', e.target.value)} className="min-h-11 min-w-0 flex-1 rounded-l-2xl bg-transparent px-4 py-2.5 outline-none sm:py-3" placeholder="Repeat your password" required /><button type="button" aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'} aria-pressed={showConfirmPassword} onClick={() => setShowConfirmPassword((visible) => !visible)} className="px-3 text-[var(--text-muted)] hover:text-[var(--charcoal)] sm:px-4">{showConfirmPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button></div>
          </div>

          {error ? <div className="md:col-span-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

          <div className="md:col-span-2">
            <button type="submit" disabled={isSubmitting} className="min-h-11 w-full rounded-2xl bg-[var(--charcoal)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--charcoal-mid)] disabled:cursor-not-allowed disabled:opacity-70 sm:py-3">
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<main className="flex flex-1 items-center justify-center text-sm text-[var(--text-muted)]" role="status">Loading registration...</main>}>
      <RegisterForm />
    </Suspense>
  );
}
