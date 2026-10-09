'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ListingImage } from '../../../components/listing-image';
import { AuthGuard } from '../../../components/auth-guard';
import { campusApi, listingApi } from '../../../lib/api';
import type { Campus, Listing } from '../../../types';

export default function StudentDashboardPage() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    async function load() {
      const [campusRes, listingRes] = await Promise.all([
        campusApi.getCampuses(),
        listingApi.searchListings({ limit: 4, sort: 'newest' }),
      ]);
      setCampuses(campusRes.data || []);
      setFeatured(listingRes.data.items || []);
      setError('');
    }
    load().catch((err) => setError(err instanceof Error ? err.message : 'Unable to load the student dashboard.'));
  }, [reloadKey]);

  return (
    <AuthGuard allowedRoles={['STUDENT']}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error ? <p role="alert" className="mb-5 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{error}<button onClick={() => setReloadKey((value) => value + 1)} className="ml-3 font-semibold underline">Retry</button></p> : null}
        <section className="overflow-hidden rounded-[30px] border border-[var(--beige)] bg-[radial-gradient(circle_at_top_left,_rgba(122,145,117,0.12),_transparent_35%),linear-gradient(135deg,#fdfaf7,#f4eadf)] p-6 shadow-[0_24px_60px_rgba(92,74,56,0.08)] sm:p-8 lg:p-10">
          <div>
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-sage)]">Student dashboard</p>
              <h1 className="mt-4 font-serif text-4xl text-[var(--charcoal)] sm:text-5xl">Find a place that feels like home.</h1>
              <p className="mt-4 max-w-xl text-base text-[var(--text-muted)]">
                Compare verified homes near campus, filter by price and distance, and discover accommodation built for student life.
              </p>
            </div>

            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/listings"
                className="inline-flex items-center justify-center rounded-2xl bg-[var(--charcoal)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--charcoal-mid)]"
              >
                Search homes
              </Link>
              <Link
                href="/student/favourites"
                className="inline-flex items-center justify-center rounded-2xl border border-[var(--beige)] bg-white/80 px-5 py-3 text-sm font-semibold text-[var(--charcoal)] transition hover:bg-white"
              >
                Saved homes
              </Link>
            </div>

            <div className="mt-6 max-w-3xl">
              <div className="flex flex-wrap gap-3 text-sm text-[var(--charcoal)]">
                <span className="rounded-full bg-[var(--beige)] px-3 py-2 font-medium">Verified listings</span>
                <span className="rounded-full bg-white/80 px-3 py-2 font-medium">Near campus</span>
                <span className="rounded-full bg-white/80 px-3 py-2 font-medium">Secure options</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="font-serif text-3xl text-[var(--charcoal)]">Popular campuses</h2>
            <Link href="/listings" className="text-sm font-semibold text-[var(--brown-dark)] hover:underline">Browse all listings</Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {campuses.map((campus) => (
              <Link
                key={campus.id}
                href={`/listings?institutionId=${campus.institutionId || ''}&campusId=${campus.id}`}
                className="group rounded-[24px] border border-[var(--beige)] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--sand)]"
              >
                <div className="h-32 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#d9c7b3,#f7efe8)]">
                  <div className="flex h-full items-end justify-between p-4 text-[var(--charcoal)]">
                    <span className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em]">Campus</span>
                    <span className="rounded-full bg-[var(--charcoal)] px-2.5 py-1 text-[10px] font-semibold text-white">{campus.listingCount ?? 0}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="font-semibold text-[var(--charcoal)]">{campus.name}</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{campus.location}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="font-serif text-3xl text-[var(--charcoal)]">Recommended for you</h2>
            <Link href="/listings" className="text-sm font-semibold text-[var(--brown-dark)] hover:underline">View all</Link>
          </div>

          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
            {featured.map((listing) => (
              <Link key={listing.id} href={`/listings/${listing.id}`} className="group overflow-hidden rounded-[26px] border border-[var(--beige)] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <div className="group relative h-48 overflow-hidden bg-[var(--cream)]">
                  <ListingImage src={listing.primaryPhoto || listing.photos?.[0]?.photoUrl} alt={listing.title} sizes="(max-width: 1280px) 100vw, 25vw" className="object-cover transition duration-300 group-hover:scale-105" />
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--charcoal)]">{listing.title}</p>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">{listing.campus?.name || 'Campus'}</p>
                    </div>
                    <span className="font-semibold text-[var(--accent-terracotta)]">R{listing.pricePerMonth.toLocaleString()}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span>{listing.accommodationType}</span>
                    <span>{listing.availableRooms} rooms left</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="rounded-full bg-[var(--beige)] px-2 py-1 text-[var(--brown-dark)]">{listing.distanceFromCampus.toFixed(1)} km</span>
                    <span className="font-medium text-[var(--charcoal)]">{listing.averageRating || 4.8} ★</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AuthGuard>
  );
}
