'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { campusApi, listingApi } from '../lib/api';
import type { Campus, Listing } from '../types';

export default function Home() {
  const [search, setSearch] = useState('');
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    Promise.all([
      campusApi.getCampuses(),
      listingApi.searchListings({ limit: 3, sort: 'newest' }),
    ]).then(([campusRes, listingRes]) => {
      setCampuses(campusRes.data || []);
      setListings(listingRes.data.items || []);
    }).catch(() => {});
  }, []);

  const searchHref = `/listings${search ? `?search=${encodeURIComponent(search)}` : ''}`;

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    window.location.href = searchHref;
  };

  return (
    <div className="overflow-hidden">
      <section className="relative min-h-[620px] overflow-hidden bg-[var(--charcoal)] text-white">
        <img
          src="https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=2200&q=85"
          alt="Warm, modern student living room"
          className="absolute inset-0 h-full w-full object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(44,36,32,0.9),rgba(44,36,32,0.45),rgba(44,36,32,0.15))]" />
        <div className="relative mx-auto flex min-h-[620px] max-w-7xl items-end px-4 pb-16 pt-20 sm:px-6 lg:px-8 lg:pb-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d9e3d5]">Student accommodation, made simpler</p>
            <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-[1.08] sm:text-6xl lg:text-7xl">A better place to begin your next chapter.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/80">Find considered, verified homes close to the campus communities that matter to you.</p>

            <form onSubmit={handleSearch} className="mt-8 flex max-w-2xl flex-col gap-3 rounded-[24px] bg-white p-2 shadow-[0_20px_50px_rgba(0,0,0,0.18)] sm:flex-row">
              <label className="sr-only" htmlFor="home-search">Search for accommodation</label>
              <input id="home-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by campus, area, or property" className="min-w-0 flex-1 rounded-2xl px-4 py-3 text-sm text-[var(--charcoal)] outline-none" />
              <button type="submit" className="rounded-2xl bg-[var(--accent-terracotta)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#ad6040]">Find a home</button>
            </form>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/85">
              <span>✓ Verified listings</span>
              <span>✓ Near your campus</span>
              <span>✓ Clear monthly pricing</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--beige)] bg-[var(--warm-white)]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-8">
          <div><p className="font-serif text-3xl text-[var(--charcoal)]">{campuses.length || '5'}+</p><p className="mt-1 text-sm text-[var(--text-muted)]">campus communities</p></div>
          <div><p className="font-serif text-3xl text-[var(--charcoal)]">{listings.length || '20'}+</p><p className="mt-1 text-sm text-[var(--text-muted)]">homes to explore</p></div>
          <div><p className="font-serif text-3xl text-[var(--charcoal)]">100%</p><p className="mt-1 text-sm text-[var(--text-muted)]">focused on student living</p></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-sage)]">Start close to campus</p>
            <h2 className="mt-3 font-serif text-4xl text-[var(--charcoal)]">Explore where you could live</h2>
          </div>
          <Link href="/listings" className="text-sm font-semibold text-[var(--brown-dark)] hover:underline">View all accommodation</Link>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {campuses.slice(0, 4).map((campus, index) => (
            <Link key={campus.id} href={`/listings?campusId=${campus.id}`} className="group relative min-h-64 overflow-hidden rounded-[24px] bg-[var(--charcoal)]">
              <img src={["https://images.unsplash.com/photo-1497366754035-f200968a6e72", "https://images.unsplash.com/photo-1523050854058-8df90110c9f1", "https://images.unsplash.com/photo-1562774053-701939374585", "https://images.unsplash.com/photo-1541339907198-e08756dedf3f"][index]} alt="" className="absolute inset-0 h-full w-full object-cover opacity-75 transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(44,36,32,0.9))]" />
              <div className="relative flex h-full min-h-64 flex-col justify-end p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/70">{campus.listingCount ?? 0} homes</p>
                <h3 className="mt-2 font-serif text-2xl">{campus.name}</h3>
                <p className="mt-1 text-sm text-white/75">{campus.location}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[#eee4da]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-terracotta)]">A considered shortlist</p><h2 className="mt-3 font-serif text-4xl text-[var(--charcoal)]">Homes worth looking at</h2></div>
            <Link href="/listings" className="text-sm font-semibold text-[var(--brown-dark)] hover:underline">Explore the full collection</Link>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {listings.map((listing) => (
              <Link key={listing.id} href={`/listings/${listing.id}`} className="group overflow-hidden rounded-[24px] bg-white shadow-[0_12px_30px_rgba(92,74,56,0.07)]">
                <div className="h-56 overflow-hidden bg-[var(--sand)]"><img src={listing.primaryPhoto || listing.photos?.[0]?.photoUrl || 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80'} alt={listing.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div>
                <div className="p-5"><div className="flex justify-between gap-3"><div><h3 className="font-semibold text-[var(--charcoal)]">{listing.title}</h3><p className="mt-1 text-sm text-[var(--text-muted)]">{listing.campus.name}</p></div><p className="font-semibold text-[var(--accent-terracotta)]">R{listing.pricePerMonth.toLocaleString()}</p></div><div className="mt-5 flex justify-between text-xs text-[var(--text-muted)]"><span>{listing.accommodationType}</span><span>{listing.distanceFromCampus.toFixed(1)} km away</span></div></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8 lg:py-20">
        <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-sage)]">For property owners</p><h2 className="mt-3 font-serif text-4xl text-[var(--charcoal)]">Have a place students would love?</h2><p className="mt-4 text-[var(--text-muted)]">Bring your property to a focused community of students searching near campus.</p></div>
        <Link href="/register" className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-[var(--charcoal)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--charcoal-mid)]">List your property</Link>
      </section>
    </div>
  );
}
