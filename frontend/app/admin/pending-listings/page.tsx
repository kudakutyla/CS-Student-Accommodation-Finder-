'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { AuthGuard } from '../../../components/auth-guard';
import { ListingImage } from '../../../components/listing-image';
import { adminApi } from '../../../lib/api';
import type { Listing } from '../../../types';

export default function PendingListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState('');
  const [submittedFrom, setSubmittedFrom] = useState('');
  const [submittedTo, setSubmittedTo] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    let active = true;
    adminApi.getPendingListings().then((response) => {
      if (active) setListings(response.data);
    }).catch((err) => {
      if (active) setError(err instanceof Error ? err.message : 'Unable to load pending listings.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  useEffect(() => {
    if (loading) return;
    const targetListingId = new URLSearchParams(window.location.search).get('listingId');
    if (targetListingId) {
      const target = document.getElementById(`pending-listing-${targetListingId}`);
      if (target) {
        target.style.backgroundColor = 'var(--cream)';
        target.style.borderRadius = '0.75rem';
        target.style.outline = '2px solid var(--accent-terracotta)';
        target.style.outlineOffset = '2px';
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [listings, loading]);

  async function runAction(listing: Listing, action: () => Promise<unknown>, message: string) {
    setBusyId(listing.id);
    setError('');
    setNotice('');
    try {
      await action();
      setNotice(message);
      setReloadKey((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The moderation action failed.');
    } finally {
      setBusyId('');
    }
  }

  const invalidDateRange = Boolean(submittedFrom && submittedTo && submittedFrom > submittedTo);
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filteredListings = invalidDateRange ? [] : listings.filter((listing) => {
    const ownerName = listing.provider?.name || listing.owner?.name || '';
    const searchableText = [
      listing.title,
      listing.address,
      listing.campus.name,
      ownerName,
    ].join(' ').toLocaleLowerCase();
    if (normalizedSearch && !searchableText.includes(normalizedSearch)) return false;

    if (submittedFrom || submittedTo) {
      const submittedAt = new Date(listing.createdAt);
      if (Number.isNaN(submittedAt.getTime())) return false;
      const localDate = [
        submittedAt.getFullYear(),
        String(submittedAt.getMonth() + 1).padStart(2, '0'),
        String(submittedAt.getDate()).padStart(2, '0'),
      ].join('-');
      if (submittedFrom && localDate < submittedFrom) return false;
      if (submittedTo && localDate > submittedTo) return false;
    }
    return true;
  });

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--beige)] pb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-terracotta)]">Publication controls</p><h1 className="mt-2 font-serif text-4xl text-[var(--charcoal)]">Pending listings</h1></div><button onClick={() => { setLoading(true); setReloadKey((value) => value + 1); }} className="border border-[var(--beige)] px-3 py-2 text-sm font-semibold">Refresh</button></header>
        {error ? <p role="alert" className="mt-4 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
        {notice ? <p role="status" className="mt-4 border-l-4 border-emerald-700 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</p> : null}
        {!loading && !error ? (
          <section aria-label="Filter pending listings" className="mt-5 overflow-hidden rounded-2xl border border-[var(--beige)] bg-[var(--warm-white)]">
            <button
              type="button"
              aria-expanded={filtersOpen}
              aria-controls="pending-listing-filter-controls"
              onClick={() => setFiltersOpen((open) => !open)}
              className="flex min-h-12 w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="flex items-center gap-2 font-semibold text-[var(--charcoal)]">
                <SlidersHorizontal size={17} aria-hidden="true" className="text-[var(--accent-terracotta)]" />
                Adjust filters
              </span>
              <ChevronDown size={20} aria-hidden="true" className={`transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
            </button>
            {filtersOpen ? (
              <div id="pending-listing-filter-controls" className="border-t border-[var(--beige)] p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:flex-nowrap lg:items-end">
                  <label className="grid min-w-0 flex-1 gap-1 text-sm font-medium text-[var(--charcoal)]">
                    Search residences
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Residence, address, campus or landlord" className="min-h-10 w-full rounded-md border border-[var(--beige)] bg-white px-3 text-sm outline-none focus:border-[var(--accent-terracotta)]" />
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-[var(--charcoal)] lg:w-40 lg:shrink-0">
                    Submitted from
                    <input type="date" value={submittedFrom} onChange={(event) => setSubmittedFrom(event.target.value)} className="min-h-10 w-full rounded-md border border-[var(--beige)] bg-white px-3 text-sm outline-none focus:border-[var(--accent-terracotta)]" />
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-[var(--charcoal)] lg:w-40 lg:shrink-0">
                    Submitted to
                    <input type="date" value={submittedTo} onChange={(event) => setSubmittedTo(event.target.value)} className="min-h-10 w-full rounded-md border border-[var(--beige)] bg-white px-3 text-sm outline-none focus:border-[var(--accent-terracotta)]" />
                  </label>
                  <button type="button" onClick={() => { setSearch(''); setSubmittedFrom(''); setSubmittedTo(''); }} className="min-h-10 shrink-0 px-3 text-sm font-semibold text-[var(--brown-dark)] underline">Clear filters</button>
                </div>
                {invalidDateRange ? <p role="alert" className="mt-3 text-sm text-red-700">The start date must be on or before the end date.</p> : null}
                <p role="status" className="mt-3 text-xs text-[var(--text-muted)]">Showing {filteredListings.length} of {listings.length} pending residences.</p>
              </div>
            ) : null}
          </section>
        ) : null}
        {loading ? <p role="status" className="py-8 text-sm text-[var(--text-muted)]">Loading pending listings...</p> : error ? null : listings.length === 0 ? <p className="py-8 text-sm text-[var(--text-muted)]">No listings are waiting for approval.</p> : filteredListings.length === 0 ? <p className="py-8 text-sm text-[var(--text-muted)]">No pending residences match these filters.</p> : <div className="divide-y divide-[var(--beige)]">{filteredListings.map((listing) => <article id={`pending-listing-${listing.id}`} key={listing.id} className="grid gap-4 py-5 sm:grid-cols-[1fr_auto]"><div><div className="flex flex-wrap items-baseline gap-3"><h2 className="font-semibold text-[var(--charcoal)]">{listing.title}</h2><span className="text-xs text-[var(--text-muted)]">{listing.accommodationType.replaceAll('_', ' ')}</span></div><p className="mt-1 text-sm text-[var(--text-muted)]">{listing.provider?.name || listing.owner?.name || 'Landlord'} · {listing.campus.name}</p><p className="mt-1 text-sm">{listing.address}</p><p className="mt-1 text-sm font-semibold">R{listing.pricePerMonth.toLocaleString()} / month · {listing.distanceFromCampus.toFixed(1)} km</p><p className="mt-1 text-xs text-[var(--text-muted)]">Submitted {new Date(listing.createdAt).toLocaleString()}</p><div className="mt-3 grid max-w-xl grid-cols-2 gap-2 sm:grid-cols-4">{listing.photos.map((photo) => <div key={photo.id} className="relative h-28 overflow-hidden border border-[var(--beige)] bg-[var(--cream)]"><ListingImage src={photo.photoUrl} alt={`${listing.title} property`} sizes="160px" /></div>)}</div><Link href={`/listings/${listing.id}`} className="mt-3 inline-block text-sm font-semibold underline">Review listing details</Link></div><div className="flex items-start gap-2 sm:flex-col"><button disabled={busyId === listing.id} onClick={() => void runAction(listing, () => adminApi.approveListing(listing.id), 'Listing approved.')} className="bg-emerald-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Approve</button><button disabled={busyId === listing.id} onClick={() => { const reason = window.prompt('Enter a rejection reason (at least 3 characters):'); if (reason?.trim()) void runAction(listing, () => adminApi.rejectListing(listing.id, reason.trim()), 'Listing rejected with a reason.'); }} className="bg-red-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Reject</button></div></article>)}</div>}
      </main>
    </AuthGuard>
  );
}
