'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AuthGuard } from '../../../components/auth-guard';
import { authApi, getMediaUrl } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

export default function StudentProfilePage() {
  const { user, updateUser } = useAuth();
  const [selectedPicture, setSelectedPicture] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [savingDetails, setSavingDetails] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [detailsError, setDetailsError] = useState('');
  const [detailsSuccess, setDetailsSuccess] = useState('');

  useEffect(() => () => { if (preview.startsWith('blob:')) URL.revokeObjectURL(preview); }, [preview]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (!selectedPicture) {
        setError('Choose an image to upload as your profile picture.');
        return;
      }

      const res = await authApi.uploadProfilePicture(selectedPicture);
      updateUser(res.data.user);
      setSelectedPicture(null);
      setPreview('');
      if (inputRef.current) inputRef.current.value = '';
      setSuccess('Profile picture updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update your profile picture.');
    } finally {
      setSaving(false);
    }
  };

  const handleDetailsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingDetails(true);
    setDetailsError('');
    setDetailsSuccess('');
    const fields = new FormData(event.currentTarget);
    try {
      const response = await authApi.updateProfile({
        name: String(fields.get('name') || ''),
        email: String(fields.get('email') || ''),
        phone: String(fields.get('phone') || '').trim() || null,
      });
      updateUser(response.data.user);
      setDetailsSuccess('Profile settings saved.');
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : 'Unable to save profile settings.');
    } finally {
      setSavingDetails(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <AuthGuard allowedRoles={['STUDENT']}>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[30px] border border-[var(--beige)] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-sage)]">Student profile</p>
          <h1 className="mt-3 font-serif text-4xl text-[var(--charcoal)]">Manage your profile</h1>

          <div className="mt-8 grid gap-6 lg:grid-cols-[220px_1fr]">
            <div className="rounded-[24px] border border-[var(--beige)] bg-[var(--cream)] p-5 text-center">
              {preview || user.profilePicture ? (
                <Image src={preview || getMediaUrl(user.profilePicture!)} alt={user.name} width={128} height={128} unoptimized className="mx-auto h-32 w-32 rounded-full object-cover ring-4 ring-white" />
              ) : (
                <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-[var(--beige)] text-3xl font-bold text-[var(--charcoal)]">
                  {user.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <p className="mt-4 text-lg font-semibold text-[var(--charcoal)]">{user.name}</p>
              <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
            </div>

            <div className="space-y-6">
              <form onSubmit={handleDetailsSubmit} className="space-y-4">
                <h2 className="font-serif text-2xl text-[var(--charcoal)]">Profile settings</h2>
                <label className="block text-sm font-semibold text-[var(--charcoal)]">Name<input name="name" required minLength={2} maxLength={100} defaultValue={user.name} className="mt-2 w-full rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-4 py-3 text-sm font-normal outline-none focus:border-[var(--accent-sage)]" /></label>
                <label className="block text-sm font-semibold text-[var(--charcoal)]">Email<input name="email" type="email" required maxLength={254} defaultValue={user.email} className="mt-2 w-full rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-4 py-3 text-sm font-normal outline-none focus:border-[var(--accent-sage)]" /></label>
                <label className="block text-sm font-semibold text-[var(--charcoal)]">Phone<input name="phone" type="tel" maxLength={30} defaultValue={user.phone || ''} className="mt-2 w-full rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-4 py-3 text-sm font-normal outline-none focus:border-[var(--accent-sage)]" /></label>
                {detailsError ? <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{detailsError}</p> : null}
                {detailsSuccess ? <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{detailsSuccess}</p> : null}
                <button type="submit" disabled={savingDetails} className="rounded-2xl bg-[var(--charcoal)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{savingDetails ? 'Saving...' : 'Save profile settings'}</button>
              </form>

              <form onSubmit={handleSubmit} className="space-y-5 border-t border-[var(--beige)] pt-6">
              <div>
                <label htmlFor="profilePicture" className="mb-2 block text-sm font-semibold text-[var(--charcoal)]">Profile picture</label>
                <input
                  id="profilePicture"
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => { const file = event.target.files?.[0] || null; setSelectedPicture(file); setPreview(file ? URL.createObjectURL(file) : ''); }}
                  className="w-full rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-4 py-3 text-sm text-[var(--charcoal)] outline-none transition focus:border-[var(--accent-sage)]"
                />
                <p className="mt-2 text-xs text-[var(--text-muted)]">JPEG, PNG, or WebP. Maximum 5 MB.</p>
              </div>

              <p className="text-sm text-[var(--text-muted)]">Tip: use a square image for the cleanest avatar preview.</p>

              {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
              {success ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-2xl bg-[var(--charcoal)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--charcoal-mid)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Uploading...' : 'Upload profile picture'}
              </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
