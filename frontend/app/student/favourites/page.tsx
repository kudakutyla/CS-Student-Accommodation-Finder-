'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookmarkX } from 'lucide-react';
import { ListingImage } from '../../../components/listing-image';
import { AuthGuard } from '../../../components/auth-guard';
import { favouriteApi } from '../../../lib/api';
import type { Favourite } from '../../../types';

export default function FavouritesPage() {
  const [items, setItems] = useState<Favourite[] | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const loading = items === null;

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

  return (
    <AuthGuard allowedRoles={['STUDENT']}>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--beige)] pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-sage)]">Student shortlist</p>
            <h1 className="mt-2 font-serif text-4xl text-[var(--charcoal)]">Saved homes</h1>
          </div>
          <Link href="/listings" className="text-sm font-semibold text-[var(--brown-dark)] underline-offset-4 hover:underline">Find more accommodation</Link>
        </div>

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
                <p className="mt-1 text-sm text-[var(--text-muted)]">{listing.campus.name} · {listing.distanceFromCampus.toFixed(1)} km from campus</p>
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