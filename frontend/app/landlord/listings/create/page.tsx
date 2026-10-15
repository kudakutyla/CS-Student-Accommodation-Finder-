'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthGuard } from '../../../../components/auth-guard';
import { campusApi, listingApi } from '../../../../lib/api';
import { useAuth } from '../../../../lib/auth-context';
import type { Campus, Institution, ListingRoutePreview } from '../../../../types';

const RoutePreviewMap = dynamic(() => import('../../../../components/route-preview-map'), {
  ssr: false,
  loading: () => <p role="status" className="py-8 text-center text-sm text-[var(--text-muted)]">Loading route map...</p>,
});

const commonAmenities = [
  'Wi-Fi / Internet',
  'Laundry Facilities',
  'Study Area / Study Room',
  'Parking',
  'Security / 24-Hour Security',
];

const initialForm = {
  title: '',
  description: '',
  institutionId: '',
  campusId: '',
  accommodationType: 'ROOM',
  pricePerMonth: '',
  address: '',
  totalRooms: '1',
  availableRooms: '1',
  amenities: '',
  availabilityStatus: 'AVAILABLE',
};

export default function CreateListingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [form, setForm] = useState(initialForm);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [customAmenities, setCustomAmenities] = useState<string[]>([]);
  const [customAmenityInput, setCustomAmenityInput] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const photoPreviewsRef = useRef<string[]>([]);
  const previewRequestId = useRef(0);
  const [routePreview, setRoutePreview] = useState<ListingRoutePreview | null>(null);
  const [isPreviewingRoute, setIsPreviewingRoute] = useState(false);
  const [routePreviewError, setRoutePreviewError] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      campusApi.getInstitutions(),
      campusApi.getCampuses(),
    ])
      .then(([institutionRes, campusRes]) => {
        setInstitutions(institutionRes.data || []);
        setCampuses(campusRes.data || []);
      })
      .catch(() => setError('We could not load the available institutions and campuses.'));
  }, []);

  useEffect(() => () => photoPreviewsRef.current.forEach((preview) => URL.revokeObjectURL(preview)), []);

  const visibleCampuses = form.institutionId ? campuses.filter((campus) => campus.institutionId === form.institutionId) : campuses;
  const allAmenities = Array.from(new Set([...selectedAmenities, ...customAmenities]));

  const invalidateRoutePreview = () => {
    previewRequestId.current += 1;
    setRoutePreview(null);
    setRoutePreviewError('');
    setIsPreviewingRoute(false);
  };

  const updateField = (field: keyof typeof initialForm, value: string) => {
    if (field === 'address' || field === 'campusId') invalidateRoutePreview();
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const previewListingRoute = async () => {
    if (!form.campusId) {
      setRoutePreviewError('Select a campus before previewing the route.');
      return;
    }
    if (form.address.trim().length < 3) {
      setRoutePreviewError('Enter a complete property address before previewing the route.');
      return;
    }

    const requestId = ++previewRequestId.current;
    setRoutePreview(null);
    setRoutePreviewError('');
    setIsPreviewingRoute(true);
    try {
      const response = await listingApi.previewLocation({
        campusId: form.campusId,
        address: form.address.trim(),
      });
      if (previewRequestId.current === requestId) setRoutePreview(response.data);
    } catch (previewError) {
      if (previewRequestId.current === requestId) {
        setRoutePreviewError(previewError instanceof Error
          ? previewError.message
          : 'Unable to preview the route. Check the address and try again.');
      }
    } finally {
      if (previewRequestId.current === requestId) setIsPreviewingRoute(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((previous) =>
      previous.includes(amenity) ? previous.filter((item) => item !== amenity) : [...previous, amenity]
    );
  };

  const addCustomAmenity = () => {
    const formatted = customAmenityInput.trim();
    if (!formatted) return;

    setCustomAmenities((previous) =>
      previous.includes(formatted) ? previous : [...previous, formatted]
    );
    setCustomAmenityInput('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (selectedPhotos.length === 0) {
      setError('Upload at least one property image before you can publish a listing.');
      return;
    }

    setIsSubmitting(true);

    try {
      const body = new FormData();
      body.set('title', form.title);
      body.set('description', form.description);
      body.set('campusId', form.campusId);
      body.set('accommodationType', form.accommodationType);
      body.set('pricePerMonth', form.pricePerMonth);
      body.set('address', form.address);
      body.set('totalRooms', form.totalRooms);
      body.set('availableRooms', form.availableRooms);
      body.set('amenities', JSON.stringify(allAmenities));
      body.set('availabilityStatus', form.availabilityStatus);
      selectedPhotos.forEach((file) => body.append('photos', file));
      await listingApi.createListing(body);
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
              <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Institution</label>
              <select required value={form.institutionId} onChange={(event) => { invalidateRoutePreview(); setForm((previous) => ({ ...previous, institutionId: event.target.value, campusId: '' })); }} className="w-full rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage)]">
                <option value="">Select an institution</option>
                {institutions.map((institution) => <option key={institution.id} value={institution.id}>{institution.name}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Campus</label>
              <select required value={form.campusId} onChange={(event) => updateField('campusId', event.target.value)} className="w-full rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage)]" disabled={!form.institutionId}>
                <option value="">{form.institutionId ? 'Select a campus' : 'Select an institution first'}</option>
                {visibleCampuses.map((campus) => <option key={campus.id} value={campus.id}>{campus.name}</option>)}
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
              <button
                type="button"
                onClick={() => void previewListingRoute()}
                disabled={isPreviewingRoute || !form.campusId || form.address.trim().length < 3}
                className="mt-3 rounded-xl border border-[var(--beige)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--brown-dark)] hover:bg-[var(--cream)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPreviewingRoute ? 'Calculating route...' : 'Preview route to campus'}
              </button>
              <p className="mt-2 text-xs text-[var(--text-muted)]">The route and driving distance are calculated by the server using the address above and the selected campus.</p>
              {routePreviewError ? <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{routePreviewError}</p> : null}
              {routePreview && form.campusId ? (
                <section className="mt-4 rounded-2xl border border-[var(--beige)] bg-[var(--warm-white)] p-4" aria-label="Route preview">
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-semibold text-[var(--charcoal)]">Driving route to {visibleCampuses.find((campus) => campus.id === form.campusId)?.name || 'campus'}</h2>
                    <p className="text-sm font-semibold text-[var(--accent-terracotta)]">{routePreview.distanceFromCampus.toFixed(1)} km</p>
                  </div>
                  <RoutePreviewMap
                    preview={routePreview}
                    campusName={visibleCampuses.find((campus) => campus.id === form.campusId)?.name || 'Campus'}
                  />
                  <p className="mt-2 text-xs text-[var(--text-muted)]">Map tiles © OpenStreetMap contributors · Route distance calculated by OSRM.</p>
                </section>
              ) : null}
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

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Amenities</label>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {commonAmenities.map((amenity) => (
                  <label key={amenity} className="flex items-center gap-2 rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-3 py-2 text-sm text-[var(--charcoal)]">
                    <input
                      type="checkbox"
                      checked={selectedAmenities.includes(amenity)}
                      onChange={() => toggleAmenity(amenity)}
                      className="h-4 w-4 rounded border-[var(--beige)] text-[var(--accent-sage)] focus:ring-[var(--accent-sage)]"
                    />
                    {amenity}
                  </label>
                ))}
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  value={customAmenityInput}
                  onChange={(event) => setCustomAmenityInput(event.target.value)}
                  placeholder="Add a custom amenity"
                  className="flex-1 rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage)]"
                />
                <button type="button" onClick={addCustomAmenity} className="rounded-2xl border border-[var(--beige)] bg-white px-4 py-3 text-sm font-semibold text-[var(--charcoal)] hover:bg-[var(--cream)]">
                  Add
                </button>
              </div>

              {allAmenities.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {allAmenities.map((amenity) => (
                    <span key={amenity} className="rounded-full bg-[var(--beige)] px-3 py-1 text-xs font-medium text-[var(--charcoal)]">
                      {amenity}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="property-photos" className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Property photos</label>
              <input id="property-photos" required type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => { photoPreviewsRef.current.forEach((preview) => URL.revokeObjectURL(preview)); const files = Array.from(event.target.files || []).slice(0, 8); const previews = files.map((file) => URL.createObjectURL(file)); photoPreviewsRef.current = previews; setSelectedPhotos(files); setPhotoPreviews(previews); }} className="w-full rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage)]" />
              <p className="mt-2 text-xs text-[var(--text-muted)]">Choose up to 8 JPEG, PNG, or WebP images. Maximum 5 MB each.</p>
              {selectedPhotos.length ? <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">{selectedPhotos.map((file, index) => <div key={`${file.name}-${file.lastModified}`} className="overflow-hidden border border-[var(--beige)] bg-white"><Image src={photoPreviews[index]} alt={`Preview of ${file.name}`} width={224} height={112} unoptimized className="h-28 w-full object-cover" /><div className="flex items-center justify-between gap-2 p-2"><span className="truncate text-xs">{file.name}</span><button type="button" aria-label={`Remove ${file.name}`} onClick={() => { URL.revokeObjectURL(photoPreviews[index]); photoPreviewsRef.current = photoPreviewsRef.current.filter((_, fileIndex) => fileIndex !== index); setSelectedPhotos((current) => current.filter((_, fileIndex) => fileIndex !== index)); setPhotoPreviews((current) => current.filter((_, fileIndex) => fileIndex !== index)); }} className="text-xs font-semibold text-red-700">Remove</button></div></div>)}</div> : null}
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
