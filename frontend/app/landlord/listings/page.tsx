'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthGuard } from '../../../components/auth-guard';
import { ListingImage } from '../../../components/listing-image';
import { campusApi, listingApi } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import type { Campus, Listing } from '../../../types';

export default function LandlordListingsPage() {
  const { user } = useAuth();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([campusApi.getCampuses(), listingApi.getMyListings()]).then(([campusResponse, listingResponse]) => {
      if (!active) return;
      setCampuses(campusResponse.data || []);
      setListings(listingResponse.data.items || []);
      setError('');
    }).catch((err) => {
      if (active) setError(err instanceof Error ? err.message : 'We could not load your properties.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [reloadKey]);

  return (
    <AuthGuard allowedRoles={['LANDLORD']}>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--beige)] pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-sage)]">Portfolio</p>
            <h1 className="mt-2 font-serif text-4xl text-[var(--charcoal)]">My properties</h1>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => { setLoading(true); setReloadKey((current) => current + 1); }} className="border border-[var(--beige)] px-4 py-3 text-sm font-semibold text-[var(--charcoal)]">Refresh</button>
            <Link href="/landlord/listings/create" className={`inline-flex items-center justify-center rounded-md px-4 py-3 text-sm font-semibold text-white ${user?.isVerified ? 'bg-[var(--charcoal)] hover:bg-[var(--charcoal-mid)]' : 'cursor-not-allowed bg-[var(--charcoal)]/50'}`} aria-disabled={!user?.isVerified}>Add a property</Link>
          </div>
        </header>

        {error ? <p role="alert" className="mt-5 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{error}<button onClick={() => { setError(''); setLoading(true); setReloadKey((current) => current + 1); }} className="ml-3 font-semibold underline">Retry</button></p> : null}

        <section className="mt-8 rounded-[28px] border border-[var(--beige)] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-sage)]">Your portfolio</p>
              <h2 className="mt-2 font-serif text-3xl text-[var(--charcoal)]">Property listings</h2>
            </div>
            <span className="text-sm text-[var(--text-muted)]">{campuses.filter((campus) => campus.isActive).length} active campuses</span>
          </div>

          {loading ? <p role="status" className="py-8 text-sm text-[var(--text-muted)]">Loading your properties...</p> : listings.length === 0 ? (
            <div className="mt-6 border border-dashed border-[var(--sand)] bg-[var(--cream)] p-8 text-center">
              <p className="font-serif text-2xl text-[var(--charcoal)]">Your portfolio is ready for its first home.</p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">Add a detailed property so students can discover it near their campus.</p>
              {user?.isVerified ? <Link href="/landlord/listings/create" className="mt-5 inline-flex bg-[var(--charcoal)] px-4 py-3 text-sm font-semibold text-white">Add a property</Link> : <p className="mt-4 text-sm text-amber-800">Your landlord account must be verified before you can submit a property.</p>}
            </div>
          ) : (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {listings.map((listing) => (
                <article key={listing.id} className="flex flex-col justify-between gap-5 border border-[var(--beige)] bg-[var(--cream)] p-4 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-4">
                    <div className="relative h-16 w-20 shrink-0 overflow-hidden bg-[var(--sand)]">
                      <ListingImage src={listing.primaryPhoto || listing.photos?.[0]?.photoUrl} alt={`${listing.title} property`} sizes="80px" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--charcoal)]">{listing.title}</h3>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">{listing.campus?.name ?? 'Campus'} · {listing.availableRooms} of {listing.totalRooms} rooms available</p>
                      <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${listing.approvalStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : listing.approvalStatus === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>{listing.approvalStatus}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[var(--accent-terracotta)]">R{listing.pricePerMonth.toLocaleString()}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{listing.distanceFromCampus.toFixed(1)} km from campus</p>
                    <Link href={`/listings/${listing.id}`} className="mt-2 inline-block text-sm font-medium text-[var(--brown-dark)] hover:underline">View details</Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </AuthGuard>
  );
}
