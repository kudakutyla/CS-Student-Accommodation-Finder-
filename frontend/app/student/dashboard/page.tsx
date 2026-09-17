'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AuthGuard } from '../../../components/auth-guard';
import { campusApi, listingApi } from '../../../lib/api';
import type { Campus, Listing } from '../../../types';

export default function StudentDashboardPage() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const [campusRes, listingRes] = await Promise.all([
        campusApi.getCampuses(),
        listingApi.searchListings({ limit: 4, sort: 'newest' }),
      ]);
      setCampuses(campusRes.data || []);
      setFeatured(listingRes.data.items || []);
    }
    load().catch(() => {});
  }, []);

  const totalListings = useMemo(
    () => featured.reduce((sum, listing) => sum + listing.availableRooms, 0),
    [featured]
  );

  return (
    <AuthGuard allowedRoles={['STUDENT']}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[30px] border border-[var(--beige)] bg-[radial-gradient(circle_at_top_left,_rgba(122,145,117,0.12),_transparent_35%),linear-gradient(135deg,#fdfaf7,#f4eadf)] p-6 shadow-[0_24px_60px_rgba(92,74,56,0.08)] sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-sage)]">Student dashboard</p>
              <h1 className="mt-4 font-serif text-4xl text-[var(--charcoal)] sm:text-5xl">Find a place that feels like home.</h1>
              <p className="mt-4 max-w-xl text-base text-[var(--text-muted)]">
                Compare verified homes near campus, filter by price and distance, and discover accommodation built for student life.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <div className="flex-1 rounded-2xl border border-[var(--beige)] bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm">
                  <label className="sr-only">Search homes</label>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by area, campus, or keyword"
                    className="w-full bg-transparent text-sm text-[var(--charcoal)] placeholder:text-[var(--text-muted)] outline-none"
                  />
                </div>
                <Link
                  href={`/listings${search ? `?search=${encodeURIComponent(search)}` : ''}`}
                  className="inline-flex items-center justify-center rounded-2xl bg-[var(--charcoal)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--charcoal-mid)]"
                >
                  Search homes
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 text-sm text-[var(--charcoal)]">
                <span className="rounded-full bg-[var(--beige)] px-3 py-2 font-medium">Verified listings</span>
                <span className="rounded-full bg-white/80 px-3 py-2 font-medium">Near campus</span>
                <span className="rounded-full bg-white/80 px-3 py-2 font-medium">Secure options</span>
              </div>
            </div>

            <div className="rounded-[28px] border border-[var(--beige)] bg-white/80 p-5 shadow-[0_12px_30px_rgba(92,74,56,0.06)] backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-sage)]">Live overview</p>
                  <p className="mt-2 font-serif text-3xl text-[var(--charcoal)]">{campuses.length}</p>
                </div>
                <div className="rounded-2xl bg-[var(--cream)] px-3 py-2 text-xs font-semibold text-[var(--brown-dark)]">Campuses</div>
              </div>

              <div className="mt-6 space-y-3">
                {campuses.slice(0, 3).map((campus) => (
                  <div key={campus.id} className="flex items-center justify-between rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-3 py-2.5">
                    <div>
                      <p className="font-semibold text-[var(--charcoal)]">{campus.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{campus.location}</p>
                    </div>
                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--accent-sage)]">{campus.listingCount ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-[var(--beige)] bg-white p-5 shadow-sm">
            <p className="text-sm text-[var(--text-muted)]">Available rooms</p>
            <p className="mt-3 font-serif text-3xl text-[var(--charcoal)]">{totalListings}</p>
          </div>
          <div className="rounded-[24px] border border-[var(--beige)] bg-white p-5 shadow-sm">
            <p className="text-sm text-[var(--text-muted)]">Nearby homes</p>
            <p className="mt-3 font-serif text-3xl text-[var(--charcoal)]">{featured.length}</p>
          </div>
          <div className="rounded-[24px] border border-[var(--beige)] bg-white p-5 shadow-sm">
            <p className="text-sm text-[var(--text-muted)]">Verified landlords</p>
            <p className="mt-3 font-serif text-3xl text-[var(--charcoal)]">{campuses.filter((campus) => campus.isActive).length}</p>
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
                href={`/listings?campusId=${campus.id}`}
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
                <div className="h-48 overflow-hidden bg-[var(--cream)]">
                  <img
                    src={listing.primaryPhoto || listing.photos?.[0]?.photoUrl || 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80'}
                    alt={listing.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
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
