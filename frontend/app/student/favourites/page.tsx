'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BookOpen, BookmarkX, Car, Check, Clipboard, Droplets, MapPin, Search, ShieldCheck, Sparkles, WashingMachine, Wifi, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ListingImage } from '../../../components/listing-image';
import { AuthGuard } from '../../../components/auth-guard';
import { favouriteApi } from '../../../lib/api';
import type { Favourite } from '../../../types';

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

export default function FavouritesPage() {
  const [items, setItems] = useState<Favourite[] | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [copyAddressId, setCopyAddressId] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<{ listingId: string; message: string; copied: boolean } | null>(null);
  const copyFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loading = items === null;

  useEffect(() => () => {
    if (copyFeedbackTimer.current) clearTimeout(copyFeedbackTimer.current);
  }, []);

  async function load() {
    try {
      const response = await favouriteApi.list();
      setItems(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your shortlist.');
      setItems([]);
    }
  }

  useEffect(() => {
    let active = true;
    favouriteApi.list().then((response) => {
      if (active) setItems(response.data);
    }).catch((err) => {
      if (!active) return;
      setError(err instanceof Error ? err.message : 'Unable to load your shortlist.');
      setItems([]);
    });
    return () => { active = false; };
  }, []);

  async function remove(listingId: string) {
    setBusyId(listingId);
    setError('');
    try {
      await favouriteApi.remove(listingId);
      setItems((current) => (current ?? []).filter((item) => item.listingId !== listingId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove this home.');
    } finally {
      setBusyId('');
    }
  }

  async function copyAddress(listingId: string, address: string) {
    if (copyFeedbackTimer.current) clearTimeout(copyFeedbackTimer.current);
    try {
      await navigator.clipboard.writeText(address);
      setCopyFeedback({ listingId, message: 'Address copied.', copied: true });
      copyFeedbackTimer.current = setTimeout(() => {
        setCopyFeedback(null);
        setCopyAddressId((current) => current === listingId ? '' : current);
        copyFeedbackTimer.current = null;
      }, 2000);
    } catch {
      setCopyFeedback(null);
      setCopyFeedback({ listingId, message: 'Unable to copy address. Check your browser clipboard permissions.', copied: false });
    }
  }

  return (
    <AuthGuard allowedRoles={['STUDENT']}>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <header className="flex flex-col gap-5 border-b border-[var(--beige)] pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-sage)]">Your shortlist</p>
            <h1 className="mt-2 font-serif text-4xl text-[var(--charcoal)]">Saved homes</h1>
          </div>
          <div className="flex justify-center">
            <Link href="/listings" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--accent-terracotta)] bg-[var(--warm-white)] px-5 py-2.5 text-sm font-semibold text-[var(--accent-terracotta)] transition hover:bg-[var(--cream)]">
              <Search size={16} aria-hidden="true" />
              Find more accommodation
            </Link>
          </div>
        </header>

        {error ? <div role="alert" className="mt-5 border-l-4 border-[var(--danger)] bg-red-50 px-4 py-3 text-sm text-red-800">{error}<button onClick={() => { setError(''); void load(); }} className="ml-3 font-semibold underline">Retry</button></div> : null}
        {loading ? <p role="status" className="py-12 text-sm text-[var(--text-muted)]">Loading saved homes...</p> : null}
        {!loading && !error && items.length === 0 ? (
          <div className="py-16 text-center">
            <h2 className="font-serif text-2xl text-[var(--charcoal)]">Your shortlist is empty</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">Save approved homes from search to compare them here.</p>
            <Link href="/listings" className="mt-5 inline-flex bg-[var(--charcoal)] px-4 py-2.5 text-sm font-semibold text-white">Browse homes</Link>
          </div>
        ) : null}

        <div className="mt-6 divide-y divide-[var(--beige)]">
          {(items ?? []).map(({ listing }) => (
            <article key={listing.id} className="grid gap-4 py-5 sm:grid-cols-[180px_1fr_auto] sm:items-center">
              <Link href={`/listings/${listing.id}`} className="relative block h-32 overflow-hidden bg-[var(--cream)]">
                <ListingImage src={listing.primaryPhoto || listing.photos?.[0]?.photoUrl} alt={listing.title} sizes="180px" />
              </Link>
              <div>
                <Link href={`/listings/${listing.id}`} className="font-semibold text-[var(--charcoal)] hover:underline">{listing.title}</Link>
                <p className="mt-1 text-sm text-[var(--accent-sage)]">{listing.campus.name}</p>
                <div className="mt-2 flex flex-wrap items-start gap-x-2 gap-y-1 text-sm text-blue-700">
                  <button
                    type="button"
                    onClick={() => {
                      setCopyAddressId((current) => current === listing.id ? '' : listing.id);
                      setCopyFeedback(null);
                    }}
                    aria-expanded={copyAddressId === listing.id}
                    aria-label={`Show copy option for address: ${listing.address}`}
                    className="flex items-start gap-1.5 text-left hover:text-blue-900"
                  >
                    <MapPin size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-blue-700" />
                    <span>{listing.address}</span>
                  </button>
                </div>
                {copyAddressId === listing.id ? (
                  <div className="mt-1 ml-[1.375rem] flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void copyAddress(listing.id, listing.address)}
                      className="inline-flex items-center gap-1 rounded border border-blue-200 px-2 py-1 text-xs font-semibold text-blue-800 hover:bg-blue-50"
                    >
                      {copyFeedback?.listingId === listing.id && copyFeedback.copied
                        ? <Check size={13} aria-hidden="true" />
                        : <Clipboard size={13} aria-hidden="true" />}
                      {copyFeedback?.listingId === listing.id && copyFeedback.copied ? 'Copied' : 'Copy'}
                    </button>
                    {copyFeedback?.listingId === listing.id ? (
                      <span role={copyFeedback.copied ? 'status' : 'alert'} className={`text-xs ${copyFeedback.copied ? 'text-emerald-700' : 'text-red-700'}`}>
                        {copyFeedback.message}
                      </span>
                    ) : null}
                  </div>
                ) : null}
                <p className="mt-1 pl-[1.375rem] text-sm text-blue-700">{listing.distanceFromCampus.toFixed(1)} km from campus</p>
                {listing.amenities.length > 0 ? (
                  <ul aria-label="Amenities" className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                    {listing.amenities.map((amenity) => {
                      const icon = getAmenityIcon(amenity);
                      return (
                        <li key={amenity} title={amenity} aria-label={amenity} className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
                          <icon.Icon size={15} aria-hidden="true" className={icon.color} />
                          <span>{amenity}</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
                <p className="mt-2 font-semibold text-[var(--accent-terracotta)]">R{listing.pricePerMonth.toLocaleString()} <span className="font-normal text-[var(--text-muted)]">per month</span></p>
              </div>
              <button type="button" disabled={busyId === listing.id} onClick={() => void remove(listing.id)} className="inline-flex items-center justify-center gap-2 border border-[var(--beige)] px-3 py-2 text-sm font-medium text-[var(--charcoal)] disabled:opacity-50">
                <BookmarkX size={16} aria-hidden="true" /> {busyId === listing.id ? 'Removing...' : 'Remove'}
              </button>
            </article>
          ))}
        </div>
      </main>
    </AuthGuard>
  );
}