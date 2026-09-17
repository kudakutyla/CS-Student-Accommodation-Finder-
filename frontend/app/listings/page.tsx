'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { campusApi, listingApi } from '../../lib/api';
import type { Campus, Listing } from '../../types';

export default function ListingsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-8 text-sm text-[var(--text-muted)]">Loading listings...</div>}>
      <ListingsPageContent />
    </Suspense>
  );
}

function ListingsPageContent() {
  const searchParams = useSearchParams();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    campusId: searchParams.get('campusId') || '',
    search: searchParams.get('search') || '',
    minPrice: '',
    maxPrice: '',
    maxDistance: '',
    type: '',
    availability: '',
    sort: 'newest',
    page: 1,
  });

  useEffect(() => {
    async function load() {
      const campusRes = await campusApi.getCampuses();
      setCampuses(campusRes.data || []);
    }
    load().catch(() => {});
  }, []);

  useEffect(() => {
    async function loadListings() {
      setLoading(true);
      const res = await listingApi.searchListings({
        campusId: filters.campusId || undefined,
        search: filters.search || undefined,
        minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
        maxDistance: filters.maxDistance ? Number(filters.maxDistance) : undefined,
        type: filters.type || undefined,
        availability: filters.availability || undefined,
        sort: filters.sort,
        page: filters.page,
        limit: 12,
      });
      setItems(res.data.items || []);
      setLoading(false);
    }
    loadListings().catch(() => setLoading(false));
  }, [filters]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 rounded-[28px] border border-[var(--beige)] bg-[var(--warm-white)] p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-sage)]">Search</p>
        <h1 className="mt-2 font-serif text-4xl text-[var(--charcoal)]">Find your perfect student home</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-[28px] border border-[var(--beige)] bg-white p-5 shadow-sm">
          <h2 className="font-serif text-2xl text-[var(--charcoal)]">Filters</h2>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Campus</label>
              <select value={filters.campusId} onChange={(e) => setFilters((prev) => ({ ...prev, campusId: e.target.value }))} className="w-full rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-3 py-2.5 text-sm text-[var(--charcoal)] outline-none">
                <option value="">All campuses</option>
                {campuses.map((campus) => (
                  <option key={campus.id} value={campus.id}>{campus.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Location</label>
              <input value={filters.search} onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))} className="w-full rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-3 py-2.5 text-sm outline-none" placeholder="Search by city or area" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Min price</label>
                <input type="number" value={filters.minPrice} onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: e.target.value }))} className="w-full rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-3 py-2.5 text-sm outline-none" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Max price</label>
                <input type="number" value={filters.maxPrice} onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))} className="w-full rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-3 py-2.5 text-sm outline-none" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Max distance (km)</label>
              <input type="number" value={filters.maxDistance} onChange={(e) => setFilters((prev) => ({ ...prev, maxDistance: e.target.value }))} className="w-full rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-3 py-2.5 text-sm outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Type</label>
                <select value={filters.type} onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))} className="w-full rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-3 py-2.5 text-sm outline-none">
                  <option value="">Any</option>
                  <option value="ROOM">Room</option>
                  <option value="APARTMENT">Apartment</option>
                  <option value="STUDENT_RESIDENCE">Residence</option>
                  <option value="HOUSE">House</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Availability</label>
                <select value={filters.availability} onChange={(e) => setFilters((prev) => ({ ...prev, availability: e.target.value }))} className="w-full rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-3 py-2.5 text-sm outline-none">
                  <option value="">Any</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="LIMITED">Limited</option>
                  <option value="FULL">Full</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Sort by</label>
              <select value={filters.sort} onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value }))} className="w-full rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-3 py-2.5 text-sm outline-none">
                <option value="newest">Newest</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="nearest">Nearest</option>
                <option value="highest-rated">Highest rated</option>
              </select>
            </div>
          </div>
        </aside>

        <main className="space-y-5">
          <div className="flex items-center justify-between rounded-[28px] border border-[var(--beige)] bg-white p-5 shadow-sm">
            <p className="text-sm text-[var(--text-muted)]">{loading ? 'Loading listings...' : `${items.length} homes found`}</p>
            <button onClick={() => setFilters({ campusId: '', search: '', minPrice: '', maxPrice: '', maxDistance: '', type: '', availability: '', sort: 'newest', page: 1 })} className="text-sm font-semibold text-[var(--brown-dark)] hover:underline">Reset filters</button>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              <div className="col-span-full rounded-[24px] border border-[var(--beige)] bg-white p-8 text-center text-sm text-[var(--text-muted)]">Loading available homes...</div>
            ) : items.length === 0 ? (
              <div className="col-span-full rounded-[24px] border border-[var(--beige)] bg-white p-8 text-center text-sm text-[var(--text-muted)]">No listings match your filters yet.</div>
            ) : (
              items.map((listing) => (
                <Link key={listing.id} href={`/listings/${listing.id}`} className="group overflow-hidden rounded-[26px] border border-[var(--beige)] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                  <div className="h-52 overflow-hidden bg-[var(--cream)]">
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

                    <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-muted)]">
                      <span>{listing.accommodationType}</span>
                      <span>{listing.availableRooms} rooms left</span>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-[var(--text-muted)]">
                      <span>{listing.distanceFromCampus.toFixed(1)} km</span>
                      <span>{listing.availabilityStatus}</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
