'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bookmark, BookOpen, Car, Droplets, MapPin, MessageCircle, Flag, ShieldCheck, Sparkles, Star, WashingMachine, Wifi, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ListingImage } from '../../../components/listing-image';
import { useAuth } from '../../../lib/auth-context';
import { conversationApi, favouriteApi, listingApi, reportApi, reviewApi } from '../../../lib/api';
import type { Listing, Review } from '../../../types';

const amenityIcons: Record<string, { Icon: LucideIcon; color: string }> = {
  wifi: { Icon: Wifi, color: 'text-sky-700' },
  internet: { Icon: Wifi, color: 'text-sky-700' },
  security: { Icon: ShieldCheck, color: 'text-emerald-700' },
  water: { Icon: Droplets, color: 'text-blue-700' },
  study: { Icon: BookOpen, color: 'text-amber-700' },
  desk: { Icon: BookOpen, color: 'text-amber-700' },
  prepaid: { Icon: Zap, color: 'text-orange-700' },
  electricity: { Icon: Zap, color: 'text-orange-700' },
  laundry: { Icon: WashingMachine, color: 'text-cyan-700' },
  washing: { Icon: WashingMachine, color: 'text-cyan-700' },
  parking: { Icon: Car, color: 'text-violet-700' },
  other: { Icon: Sparkles, color: 'text-rose-700' },
};

function getAmenityIcon(amenity: string) {
  const normalizedAmenity = amenity.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const matchingAmenity = Object.entries(amenityIcons).find(([name]) =>
    name === 'other' ? false : normalizedAmenity.includes(name)
  );
  return amenityIcons[matchingAmenity?.[0] ?? 'other'];
}

export default function ListingDetail({ listingId }: { listingId: string }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reportNotice, setReportNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [isFavourite, setIsFavourite] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [reportReason, setReportReason] = useState('Inaccurate information');
  const [reportDescription, setReportDescription] = useState('');

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      if (!authLoading) router.replace(`/login?redirect=${encodeURIComponent(`/listings/${listingId}`)}`);
      return;
    }
    async function load() {
      try {
        const [listingResponse, reviewResponse] = await Promise.all([
          listingApi.getListingById(listingId),
          reviewApi.list(listingId),
        ]);
        setListing(listingResponse.data);
        setReviews(reviewResponse.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load this listing.');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [authLoading, isAuthenticated, listingId, router]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'STUDENT') return;
    favouriteApi.list().then((response) => {
      setIsFavourite(response.data.some((item) => item.listingId === listingId));
    }).catch((err) => {
      setError(err instanceof Error ? err.message : 'Unable to check your shortlist.');
    });
  }, [isAuthenticated, listingId, user?.role]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(''), 3000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  async function toggleFavourite() {
    setBusy(true);
    setError('');
    try {
      if (isFavourite) await favouriteApi.remove(listingId);
      else await favouriteApi.add(listingId);
      setIsFavourite((value) => !value);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update your shortlist.');
    } finally {
      setBusy(false);
    }
  }

  async function startEnquiry() {
    setBusy(true);
    setError('');
    try {
      const response = await conversationApi.start(listingId);
      router.push(`/messages?conversation=${encodeURIComponent(response.data.id)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start an enquiry.');
    } finally {
      setBusy(false);
    }
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (isEditingReview) {
        const ownReview = reviews.find((review) => review.user.id === user?.id);
        if (!ownReview) {
          setError('Your review could not be found. Refresh the page and try again.');
          return;
        }
        const response = await reviewApi.updateMine(listingId, { rating, comment });
        setReviews((current) => current.map((review) => review.id === ownReview.id ? response.data : review));
        setIsEditingReview(false);
        setNotice('Your review has been updated.');
      } else {
        const response = await reviewApi.create(listingId, { rating, comment });
        setReviews((current) => [response.data, ...current]);
        setComment('');
        setNotice('Your review has been submitted.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit your review.');
    } finally {
      setBusy(false);
    }
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setReportNotice('');
    try {
      const response = await reportApi.create(listingId, { reason: reportReason, description: reportDescription });
      setReportDescription('');
      setReportNotice(response.message || 'Report submitted successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit your report.');
    } finally {
      setBusy(false);
    }
  }

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push('/listings');
  }

  if (authLoading || !isAuthenticated || loading) return <p role="status" className="mx-auto max-w-5xl px-4 py-16 text-sm text-[var(--text-muted)]">Loading accommodation details...</p>;
  if (error && !listing) return <main className="mx-auto max-w-5xl px-4 py-16"><p role="alert" className="text-sm text-red-700">{error}</p><Link href="/listings" className="mt-4 inline-block underline">Back to search</Link></main>;
  if (!listing) return null;

  const average = reviews.length ? reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length : 0;
  const ownReview = user ? reviews.find((review) => review.user.id === user.id) : undefined;
  const hasReviewed = Boolean(ownReview);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {error ? <p role="alert" className="mb-4 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
      <button
        type="button"
        onClick={goBack}
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brown-dark)] hover:underline"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back
      </button>
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="relative aspect-[4/3] overflow-hidden bg-[var(--cream)]">
            <ListingImage src={listing.primaryPhoto || listing.photos?.[0]?.photoUrl} alt={listing.title} sizes="(max-width: 1024px) 100vw, 60vw" />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {listing.photos.filter((photo) => photo.photoUrl !== listing.primaryPhoto).map((photo) => <div key={photo.id} className="relative h-20 w-28 overflow-hidden"><ListingImage src={photo.photoUrl} alt={`${listing.title} property`} sizes="112px" /></div>)}
          </div>
        </div>
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-sage)]">{listing.campus.name}</p>
          <h1 className="mt-2 font-serif text-4xl text-[var(--charcoal)]">{listing.title}</h1>
          <p className="mt-3 flex items-start gap-1.5 text-sm text-blue-700">
            <MapPin size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-blue-700" />
            <span>{listing.address}</span>
          </p>
          <p className="mt-1 pl-[1.375rem] text-sm text-blue-700">{listing.distanceFromCampus.toFixed(1)} km from campus</p>
          <p className="mt-5 text-2xl font-semibold text-[var(--accent-terracotta)]">R{listing.pricePerMonth.toLocaleString()} <span className="text-sm font-normal text-[var(--text-muted)]">per month</span></p>
          <p className="mt-4 text-sm leading-6 text-[var(--charcoal-mid)]">{listing.description}</p>
          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            <span className="border border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)] px-3 py-1.5 text-white">{listing.availableRooms} rooms available</span>
            <span className="border border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)] px-3 py-1.5 text-white">{listing.accommodationType.replaceAll('_', ' ')}</span>
            <span className="inline-flex items-center gap-1 border border-[var(--accent-terracotta)] bg-[var(--accent-terracotta)] px-3 py-1.5 text-white" aria-label={average ? `${average.toFixed(1)} out of 5 from ${reviews.length} reviews` : 'No reviews'}>
              {average ? [1, 2, 3, 4, 5].map((value) => (
                <Star key={value} size={15} aria-hidden="true" className={value <= Math.round(average) ? 'fill-yellow-300 text-yellow-300' : 'text-white/70'} />
              )) : <span>No rating</span>}
            </span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">{listing.amenities.map((amenity) => {
            const icon = getAmenityIcon(amenity);
            return (
              <span key={amenity} className="inline-flex items-center gap-1.5 bg-[var(--cream)] px-3 py-1.5 text-sm">
                <icon.Icon size={16} aria-hidden="true" className={icon.color} />
                {amenity}
              </span>
            );
          })}</div>
          {listing.provider || listing.owner ? <p className="mt-6 border-t border-[var(--beige)] pt-4 text-sm">Provided by <strong>{listing.provider?.name ?? listing.owner?.name}</strong>{(listing.provider?.isVerified ?? listing.owner?.isVerified) ? ' · Verified landlord' : ''}</p> : null}
          {isAuthenticated && user?.role === 'STUDENT' ? (
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                aria-pressed={isFavourite}
                disabled={busy}
                onClick={() => void toggleFavourite()}
                className={`inline-flex items-center gap-2 border px-4 py-2.5 text-sm font-semibold disabled:opacity-50 ${
                  isFavourite
                    ? 'border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800'
                    : 'border-[var(--charcoal)] text-[var(--charcoal)]'
                }`}
              >
                <Bookmark size={16} aria-hidden="true" />
                {isFavourite ? 'Saved' : 'Save home'}
              </button>
              <button disabled={busy} onClick={() => void startEnquiry()} className="inline-flex items-center gap-2 bg-[var(--charcoal)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><MessageCircle size={16} aria-hidden="true" />Contact landlord</button>
            </div>
          ) : null}
        </section>
      </div>

      <section className="mt-12 grid gap-10 border-t border-[var(--beige)] pt-8 lg:grid-cols-2">
        <div>
          <h2 className="font-serif text-2xl text-[var(--charcoal)]">Student reviews</h2>
          {notice ? <p role="status" className="mt-3 border-l-4 border-emerald-700 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</p> : null}
          {isAuthenticated && user?.role === 'STUDENT' && (!hasReviewed || isEditingReview) ? (
            <form onSubmit={submitReview} className="mt-4 grid gap-3 border-b border-[var(--beige)] pb-5">
              <fieldset>
                <legend className="text-sm font-medium">Your rating</legend>
                <div role="radiogroup" aria-label="Your rating" className="mt-2 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value} className="cursor-pointer rounded p-1 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--accent-terracotta)]">
                      <input
                        type="radio"
                        name="review-rating"
                        value={value}
                        checked={rating === value}
                        onChange={() => setRating(value)}
                        aria-label={`${value} ${value === 1 ? 'star' : 'stars'}`}
                        className="sr-only"
                      />
                      <Star
                        size={25}
                        aria-hidden="true"
                        className={value <= rating ? 'fill-[var(--accent-terracotta)] text-[var(--accent-terracotta)]' : 'text-[var(--text-muted)]'}
                      />
                    </label>
                  ))}
                  <span className="ml-2 text-sm text-[var(--text-muted)]">{rating} out of 5</span>
                </div>
              </fieldset>
              <label className="grid gap-1 text-sm font-medium">Review (optional)<textarea minLength={3} maxLength={1200} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Share a few words about your experience (optional)" className="min-h-24 border border-[var(--beige)] p-3" /></label>
              <div className="flex flex-wrap gap-2">
                <button disabled={busy} className="w-fit bg-[var(--charcoal)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{isEditingReview ? 'Save changes' : 'Submit review'}</button>
                {isEditingReview ? <button type="button" disabled={busy} onClick={() => setIsEditingReview(false)} className="w-fit border border-[var(--beige)] px-4 py-2 text-sm font-semibold disabled:opacity-50">Cancel</button> : null}
              </div>
            </form>
          ) : null}
          {isAuthenticated && user?.role === 'STUDENT' && hasReviewed && !isEditingReview ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-l-4 border-[var(--accent-sage)] bg-[var(--cream)] px-4 py-3">
              <p role="status" className="text-sm text-[var(--charcoal)]">You have already reviewed this listing</p>
              <button type="button" onClick={() => { setRating(ownReview?.rating ?? 5); setComment(ownReview?.comment ?? ''); setIsEditingReview(true); }} className="text-sm font-semibold text-[var(--brown-dark)] underline underline-offset-2">Edit</button>
            </div>
          ) : null}
          <div className="divide-y divide-[var(--beige)]">
            {reviews.length ? reviews.map((review) => <article key={review.id} className="py-4"><p className="flex items-center gap-2 text-sm font-semibold">{review.user.name}<span className="inline-flex items-center gap-0.5" aria-label={`${review.rating} out of 5 stars`}>{[1, 2, 3, 4, 5].map((value) => <Star key={value} size={14} aria-hidden="true" className={value <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--text-muted)]'} />)}</span></p>{review.comment ? <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{review.comment}</p> : null}</article>) : <p className="py-4 text-sm text-[var(--text-muted)]">No reviews yet.</p>}
          </div>
        </div>
        {isAuthenticated && user?.role === 'STUDENT' ? (
          <form onSubmit={submitReport} className="h-fit border border-[var(--beige)] p-5">
            <h2 className="inline-flex items-center gap-2 font-serif text-2xl text-[var(--charcoal)]"><Flag size={18} aria-hidden="true" />Report a concern</h2>
            {reportNotice ? <p role="status" className="mt-3 border-l-4 border-emerald-700 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{reportNotice}</p> : null}
            <label className="mt-4 grid gap-1 text-sm font-medium">Reason<input required maxLength={200} value={reportReason} onChange={(event) => setReportReason(event.target.value)} className="border border-[var(--beige)] p-2.5" /></label>
            <label className="mt-3 grid gap-1 text-sm font-medium">Details<textarea required minLength={10} maxLength={2000} value={reportDescription} onChange={(event) => setReportDescription(event.target.value)} placeholder="Describe your concern in at least 10 characters" className="min-h-24 border border-[var(--beige)] p-2.5 placeholder:text-[var(--text-muted)]" /></label>
            <button disabled={busy} className="mt-3 border border-[var(--charcoal)] px-4 py-2 text-sm font-semibold disabled:opacity-50">Send report</button>
          </form>
        ) : null}
      </section>
    </main>
  );
}