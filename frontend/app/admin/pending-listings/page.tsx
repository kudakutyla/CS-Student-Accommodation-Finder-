'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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

  useEffect(() => {
    let active = true;
    adminApi.getPendingListings().then((response) => {
      if (active) setListings(response.data);
    }).catch((err) => {
      if (active) setError(err instanceof Error ? err.message : 'Unable to load pending listings.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

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

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--beige)] pb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-terracotta)]">Publication controls</p><h1 className="mt-2 font-serif text-4xl text-[var(--charcoal)]">Pending listings</h1></div><button onClick={() => { setLoading(true); setReloadKey((value) => value + 1); }} className="border border-[var(--beige)] px-3 py-2 text-sm font-semibold">Refresh</button></header>
        {error ? <p role="alert" className="mt-4 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
        {notice ? <p role="status" className="mt-4 border-l-4 border-emerald-700 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</p> : null}
        {loading ? <p role="status" className="py-8 text-sm text-[var(--text-muted)]">Loading pending listings...</p> : listings.length === 0 ? <p className="py-8 text-sm text-[var(--text-muted)]">No listings are waiting for approval.</p> : <div className="divide-y divide-[var(--beige)]">{listings.map((listing) => <article key={listing.id} className="grid gap-4 py-5 sm:grid-cols-[1fr_auto]"><div><div className="flex flex-wrap items-baseline gap-3"><h2 className="font-semibold text-[var(--charcoal)]">{listing.title}</h2><span className="text-xs text-[var(--text-muted)]">{listing.accommodationType.replaceAll('_', ' ')}</span></div><p className="mt-1 text-sm text-[var(--text-muted)]">{listing.provider?.name || listing.owner?.name || 'Landlord'} · {listing.campus.name}</p><p className="mt-1 text-sm">{listing.address}</p><p className="mt-1 text-sm font-semibold">R{listing.pricePerMonth.toLocaleString()} / month · {listing.distanceFromCampus.toFixed(1)} km</p><div className="mt-3 grid max-w-xl grid-cols-2 gap-2 sm:grid-cols-4">{listing.photos.map((photo) => <div key={photo.id} className="relative h-28 overflow-hidden border border-[var(--beige)] bg-[var(--cream)]"><ListingImage src={photo.photoUrl} alt={`${listing.title} property`} sizes="160px" /></div>)}</div><Link href={`/listings/${listing.id}`} className="mt-3 inline-block text-sm font-semibold underline">Review listing details</Link></div><div className="flex items-start gap-2 sm:flex-col"><button disabled={busyId === listing.id} onClick={() => void runAction(listing, () => adminApi.approveListing(listing.id), 'Listing approved.')} className="bg-emerald-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Approve</button><button disabled={busyId === listing.id} onClick={() => { const reason = window.prompt('Enter a rejection reason (at least 3 characters):'); if (reason?.trim()) void runAction(listing, () => adminApi.rejectListing(listing.id, reason.trim()), 'Listing rejected with a reason.'); }} className="bg-red-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Reject</button></div></article>)}</div>}
      </main>
    </AuthGuard>
  );
}
