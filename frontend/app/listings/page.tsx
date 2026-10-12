'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { ListingImage } from '../../components/listing-image';
import { campusApi, listingApi } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import type { Campus, Institution, Listing } from '../../types';

export default function ListingsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-8 text-sm text-[var(--text-muted)]">Loading listings...</div>}>
      <ListingsPageContent />
    </Suspense>
  );
}

function ListingsPageContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const currentQuery = searchParams.toString();
  const returnPath = `${pathname}${currentQuery ? `?${currentQuery}` : ''}`;
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const initialFilters = {
    institutionId: searchParams.get('institutionId') || '',
    campusId: searchParams.get('campusId') || '',
    keyword: searchParams.get('search') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    type: searchParams.get('type') || '',
    availability: searchParams.get('availability') || '',
    sort: searchParams.get('sort') || 'newest',
    page: Number(searchParams.get('page')) || 1,
  };
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(returnPath)}`);
    }
  }, [authLoading, isAuthenticated, returnPath, router]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    async function load() {
      const [institutionRes, campusRes] = await Promise.all([campusApi.getInstitutions(), campusApi.getCampuses()]);
      setInstitutions(institutionRes.data || []);
      setCampuses(campusRes.data || []);
    }
    load().catch((err) => setError(err instanceof Error ? err.message : 'Unable to load campuses.'));
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    async function loadListings() {
      setLoading(true);
      setError('');
      try {
        const res = await listingApi.searchListings({
        institutionId: appliedFilters.institutionId || undefined,
        campusId: appliedFilters.campusId || undefined,
        search: appliedFilters.keyword || undefined,
        minPrice: appliedFilters.minPrice ? Number(appliedFilters.minPrice) : undefined,
        maxPrice: appliedFilters.maxPrice ? Number(appliedFilters.maxPrice) : undefined,
        type: appliedFilters.type || undefined,
        availability: appliedFilters.availability || undefined,
        sort: appliedFilters.sort,
        page: appliedFilters.page,
        limit: 12,
        });
        setItems(res.data.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load listings.');
      } finally {
        setLoading(false);
      }
    }
    void loadListings();
  }, [authLoading, isAuthenticated, appliedFilters, retryKey]);

  function applyFilters() {
    const nextFilters = { ...filters, page: 1 };
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
  }

  function resetFilters() {
    const reset = {
      institutionId: '',
      campusId: '',
      keyword: '',
      minPrice: '',
      maxPrice: '',
      type: '',
      availability: '',
      sort: 'newest',
      page: 1,
    };
    setFilters(reset);
    setAppliedFilters(reset);
  }

  if (authLoading || !isAuthenticated) {
    return <div role="status" className="mx-auto max-w-7xl px-4 py-12 text-sm text-[var(--text-muted)]">Redirecting to sign in...</div>;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 rounded-[28px] border border-[var(--beige)] bg-[var(--warm-white)] p-6 shadow-sm">
        <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-sage)]">{user?.role === 'LANDLORD' ? 'Market overview' : 'Search'}</p>
        <h1 className="mt-2 font-serif text-4xl text-[var(--charcoal)]">{user?.role === 'LANDLORD' ? 'Explore the student accommodation market' : 'Find your perfect student home'}</h1>
        {user?.role === 'LANDLORD' ? <p className="mt-3 text-sm text-[var(--text-muted)]">Compare approved student accommodation near campus and see how your properties fit the local market.</p> : null}
        </div>
        {user?.role === 'STUDENT' ? <Link href="/student/favourites" className="text-sm font-semibold text-[var(--brown-dark)] underline-offset-4 hover:underline">Saved homes</Link> : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="h-fit rounded-[28px] border border-[var(--beige)] bg-white p-5 shadow-sm">
          <button
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="listing-filter-controls"
            onClick={() => setFiltersOpen((open) => !open)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="flex items-center gap-2 font-serif text-2xl text-[var(--charcoal)]">
              <SlidersHorizontal size={21} strokeWidth={2.2} aria-hidden="true" className="text-[var(--accent-terracotta)]" />
              Filters
            </span>
            <ChevronDown size={20} aria-hidden="true" className={`transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>

          {filtersOpen ? <div id="listing-filter-controls" className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Institution</label>
              <select value={filters.institutionId} onChange={(e) => setFilters((prev) => ({ ...prev, institutionId: e.target.value, campusId: '' }))} className="w-full rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-3 py-2.5 text-sm text-[var(--charcoal)] outline-none">
                <option value="">All institutions</option>
                {institutions.map((institution) => <option key={institution.id} value={institution.id}>{institution.name}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Campus</label>
              <select value={filters.campusId} onChange={(e) => setFilters((prev) => ({ ...prev, campusId: e.target.value }))} disabled={!filters.institutionId} className="w-full rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-3 py-2.5 text-sm text-[var(--charcoal)] outline-none disabled:opacity-60">
                <option value="">{filters.institutionId ? 'All campuses' : 'Choose an institution first'}</option>
                {campuses.filter((campus) => campus.institutionId === filters.institutionId).map((campus) => <option key={campus.id} value={campus.id}>{campus.name}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--charcoal)]">Property keyword</label>
              <input value={filters.keyword} onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))} className="w-full rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-3 py-2.5 text-sm outline-none" placeholder="Name or features" />
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
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={applyFilters} disabled={loading} className="flex-1 rounded-2xl bg-[var(--charcoal)] px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                Apply filters
              </button>
              <button type="button" onClick={resetFilters} className="flex-1 rounded-2xl border border-[var(--beige)] px-3 py-2.5 text-sm font-semibold text-[var(--charcoal)] hover:bg-[var(--cream)]">
                Reset filters
              </button>
            </div>
          </div> : null}
        </aside>

        <div className="space-y-5">
          {error ? <p role="alert" className="border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{error}<button onClick={() => setRetryKey((value) => value + 1)} className="ml-3 font-semibold underline">Retry</button></p> : null}
          <div className="flex items-center justify-between rounded-[28px] border border-[var(--beige)] bg-white p-5 shadow-sm">
            <p className="text-sm text-[var(--text-muted)]">{loading ? 'Loading listings...' : `${items.length} homes found`}</p>
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--accent-terracotta)]/30 bg-[var(--warm-white)] px-4 py-2.5 text-left text-sm font-semibold text-[var(--charcoal)] shadow-sm hover:bg-[var(--cream)]"
            >
              <SlidersHorizontal size={17} aria-hidden="true" className="shrink-0 text-[var(--accent-terracotta)]" />
              <span>Adjust filters <span className="font-normal text-[var(--text-muted)]">— open the Filters menu</span></span>
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              <div className="col-span-full rounded-[24px] border border-[var(--beige)] bg-white p-8 text-center text-sm text-[var(--text-muted)]">Loading available homes...</div>
            ) : items.length === 0 ? (
              <div className="col-span-full rounded-[24px] border border-[var(--beige)] bg-white p-8 text-center text-sm text-[var(--text-muted)]">No listings match your filters yet.</div>
            ) : (
              items.map((listing) => (
                <Link key={listing.id} href={`/listings/${listing.id}`} className="group overflow-hidden rounded-[26px] border border-[var(--beige)] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                  <div className="relative h-52 overflow-hidden bg-[var(--cream)]">
                    <ListingImage src={listing.primaryPhoto || listing.photos?.[0]?.photoUrl} alt={listing.title} sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover transition duration-300 group-hover:scale-105" />
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
        </div>
      </div>
    </main>
  );
}
