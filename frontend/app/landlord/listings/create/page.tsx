'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthGuard } from '../../../../components/auth-guard';
import { campusApi, listingApi } from '../../../../lib/api';
import { useAuth } from '../../../../lib/auth-context';
import type { Campus } from '../../../../types';

const initialForm = {
  title: '',
  description: '',
  campusId: '',
  accommodationType: 'ROOM',
  pricePerMonth: '',
  address: '',
  latitude: '',
  longitude: '',
  totalRooms: '1',
  availableRooms: '1',
  amenities: '',
  photos: '',
  availabilityStatus: 'AVAILABLE',
};

export default function CreateListingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    campusApi.getCampuses().then((res) => setCampuses(res.data || [])).catch(() => setError('We could not load the available campuses.'));
  }, []);

  const updateField = (field: keyof typeof initialForm, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await listingApi.createListing({
        title: form.title,
        description: form.description,
        campusId: form.campusId,
        accommodationType: form.accommodationType,
        pricePerMonth: Number(form.pricePerMonth),
        address: form.address,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        totalRooms: Number(form.totalRooms),
        availableRooms: Number(form.availableRooms),
        amenities: form.amenities.split(',').map((item) => item.trim()).filter(Boolean),
        photos: form.photos.split(',').map((item) => item.trim()).filter(Boolean),
        availabilityStatus: form.availabilityStatus,
      });
      router.push('/landlord/dashboard');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit this listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard allowedRoles={['LANDLORD']}>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/landlord/dashboard" className="text-sm font-semibold text-[var(--brown-dark)] hover:underline">Back to workspace</Link>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-sage)]">New property</p>
          <h1 className="mt-2 font-serif text-4xl text-[var(--charcoal)]">Add accommodation for students</h1>
          <p className="mt-3 max-w-2xl text-sm text-[var(--text-muted)]">Complete the property details below. Your listing will be sent for administrator approval before it appears publicly.</p>
        </div>

        {!user?.isVerified ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Your account must be verified before you can submit a listing.</div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6 rounded-[28px] border border-[var(--beige)] bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Property title</label>
              <input required value={form.title} onChange={(event) => updateField('title', event.target.value)} placeholder="e.g. Hatfield Student Residence" className="w-full rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage)]" />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Description</label>
              <textarea required minLength={10} rows={4} value={form.description} onChange={(event) => updateField('description', event.target.value)} placeholder="Describe the home, facilities, safety, and what makes it suitable for students." className="w-full resize-y rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage)]" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Nearby campus</label>
              <select required value={form.campusId} onChange={(event) => updateField('campusId', event.target.value)} className="w-full rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage)]">
                <option value="">Select a campus</option>
                {campuses.map((campus) => <option key={campus.id} value={campus.id}>{campus.name}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Accommodation type</label>
              <select value={form.accommodationType} onChange={(event) => updateField('accommodationType', event.target.value)} className="w-full rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage)]">
                {['ROOM', 'SHARED_ROOM', 'APARTMENT', 'BACHELOR', 'STUDIO', 'HOUSE', 'SHARED_HOUSE', 'TOWNHOUSE', 'STUDENT_RESIDENCE', 'OTHER'].map((type) => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Property address</label>
              <input required value={form.address} onChange={(event) => updateField('address', event.target.value)} placeholder="Street address, suburb, city" className="w-full rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage)]" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Monthly price (R)</label>
              <input required min="1" type="number" value={form.pricePerMonth} onChange={(event) => updateField('pricePerMonth', event.target.value)} className="w-full rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage)]" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Availability</label>
              <select value={form.availabilityStatus} onChange={(event) => updateField('availabilityStatus', event.target.value)} className="w-full rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage)]">
                <option value="AVAILABLE">Available</option>
                <option value="LIMITED">Limited</option>
                <option value="FULL">Full</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Total rooms</label>
              <input required min="1" type="number" value={form.totalRooms} onChange={(event) => updateField('totalRooms', event.target.value)} className="w-full rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage)]" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Available rooms</label>
              <input required min="0" type="number" value={form.availableRooms} onChange={(event) => updateField('availableRooms', event.target.value)} className="w-full rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage)]" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Latitude</label>
              <input required type="number" step="any" value={form.latitude} onChange={(event) => updateField('latitude', event.target.value)} placeholder="-25.7545" className="w-full rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage)]" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Longitude</label>
              <input required type="number" step="any" value={form.longitude} onChange={(event) => updateField('longitude', event.target.value)} placeholder="28.2314" className="w-full rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage)]" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Amenities</label>
              <input value={form.amenities} onChange={(event) => updateField('amenities', event.target.value)} placeholder="WiFi, Security, Parking" className="w-full rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage)]" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Photo URLs</label>
              <input required value={form.photos} onChange={(event) => updateField('photos', event.target.value)} placeholder="https://... , https://..." className="w-full rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage)]" />
            </div>
          </div>

          {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

          <div className="flex flex-col-reverse gap-3 border-t border-[var(--beige)] pt-6 sm:flex-row sm:justify-end">
            <Link href="/landlord/dashboard" className="inline-flex items-center justify-center rounded-2xl border border-[var(--beige)] px-5 py-3 text-sm font-semibold text-[var(--charcoal)]">Cancel</Link>
            <button type="submit" disabled={isSubmitting || !user?.isVerified} className="rounded-2xl bg-[var(--charcoal)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--charcoal-mid)] disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? 'Submitting for review...' : 'Submit listing for review'}</button>
          </div>
        </form>
      </div>
    </AuthGuard>
  );
}
