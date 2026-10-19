'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Bookmark, ChevronDown, MapPin, SlidersHorizontal } from 'lucide-react';
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
  const [totalHomes, setTotalHomes] = useState<number | null>(null);
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
      setTotalHomes(null);
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
        setTotalHomes(res.data.pagination.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load listings.');
        setTotalHomes(null);
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
    setFiltersOpen(false);
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
      <header className={`mb-6 flex flex-wrap items-end justify-between gap-4 rounded-[28px] border border-[var(--beige)] bg-[var(--warm-white)] p-6 shadow-sm ${user?.role === 'STUDENT' ? 'flex-col items-stretch' : ''}`}>
        <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-sage)]">{user?.role === 'LANDLORD' ? 'Market overview' : 'Search'}</p>
        <h1 className="mt-2 font-serif text-4xl text-[var(--charcoal)]">{user?.role === 'LANDLORD' ? 'Explore the student accommodation market' : 'Find your perfect student home'}</h1>
        {user?.role === 'LANDLORD' ? <p className="mt-3 text-sm text-[var(--text-muted)]">Compare approved student accommodation near campus and see how your properties fit the local market.</p> : null}
        </div>
        {user?.role === 'STUDENT' ? (
          <Link href="/student/favourites" className="mt-1 inline-flex min-h-10 self-center items-center justify-center gap-2 rounded-xl bg-[var(--charcoal)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--charcoal-mid)]">
            <Bookmark size={16} aria-hidden="true" />
            Saved homes
          </Link>
        ) : null}
      </header>

      <div className="space-y-6">
        <aside className="h-fit rounded-2xl border border-[var(--beige)] bg-[var(--warm-white)] p-0 shadow-sm">
          <button
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="listing-filter-controls"
            onClick={() => setFiltersOpen((open) => !open)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <span className="flex items-center gap-2 font-serif text-2xl text-[var(--charcoal)]">
              <SlidersHorizontal size={21} strokeWidth={2.2} aria-hidden="true" className="text-[var(--accent-terracotta)]" />
              Adjust filters
            </span>
            <span className="flex items-center gap-2">
              {totalHomes !== null && !loading && !error ? (
                <span aria-label={`${totalHomes} homes found`} className="font-sans text-sm font-semibold text-[var(--text-muted)]">
                  {totalHomes}
                </span>
              ) : null}
              <ChevronDown size={20} aria-hidden="true" className={`transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
            </span>
          </button>

          {filtersOpen ? <div id="listing-filter-controls" className="border-t border-[var(--beige)] p-4">
            <div className="flex flex-col gap-3">
              <label className="grid min-w-0 flex-1 gap-1 text-xs font-semibold text-[var(--charcoal)]">
                Institution
                <select value={filters.institutionId} onChange={(e) => setFilters((prev) => ({ ...prev, institutionId: e.target.value, campusId: '' }))} className="min-h-10 w-full border border-[var(--beige)] bg-white px-3 py-2 text-sm font-normal text-[var(--charcoal)] outline-none">
                  <option value="">All institutions</option>
                  {institutions.map((institution) => <option key={institution.id} value={institution.id}>{institution.name}</option>)}
                </select>
              </label>

              <label className="grid min-w-0 flex-1 gap-1 text-xs font-semibold text-[var(--charcoal)]">
                Campus
                <select value={filters.campusId} onChange={(e) => setFilters((prev) => ({ ...prev, campusId: e.target.value }))} disabled={!filters.institutionId} className="min-h-10 w-full border border-[var(--beige)] bg-white px-3 py-2 text-sm font-normal text-[var(--charcoal)] outline-none disabled:opacity-60">
                  <option value="">{filters.institutionId ? 'All campuses' : 'Choose an institution first'}</option>
                  {campuses.filter((campus) => campus.institutionId === filters.institutionId).map((campus) => <option key={campus.id} value={campus.id}>{campus.name}</option>)}
                </select>
              </label>

              <label className="grid min-w-0 flex-1 gap-1 text-xs font-semibold text-[var(--charcoal)]">
                Property keyword
                <input value={filters.keyword} onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))} className="min-h-10 w-full border border-[var(--beige)] bg-white px-3 py-2 text-sm font-normal text-[var(--charcoal)] outline-none" placeholder="Name or features" />
              </label>

              <label className="grid min-w-0 flex-1 gap-1 text-xs font-semibold text-[var(--charcoal)]">
                Min price
                <input type="number" value={filters.minPrice} onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: e.target.value }))} className="min-h-10 w-full border border-[var(--beige)] bg-white px-3 py-2 text-sm font-normal text-[var(--charcoal)] outline-none" />
              </label>

              <label className="grid min-w-0 flex-1 gap-1 text-xs font-semibold text-[var(--charcoal)]">
                Max price
                <input type="number" value={filters.maxPrice} onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))} className="min-h-10 w-full border border-[var(--beige)] bg-white px-3 py-2 text-sm font-normal text-[var(--charcoal)] outline-none" />
              </label>

              <label className="grid min-w-0 flex-1 gap-1 text-xs font-semibold text-[var(--charcoal)]">
                Type
                <select value={filters.type} onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))} className="min-h-10 w-full border border-[var(--beige)] bg-white px-3 py-2 text-sm font-normal text-[var(--charcoal)] outline-none">
                  <option value="">Any</option>
                  <option value="ROOM">Room</option>
                  <option value="APARTMENT">Apartment</option>
                  <option value="STUDENT_RESIDENCE">Residence</option>
                  <option value="HOUSE">House</option>
                </select>
              </label>

              <label className="grid min-w-0 flex-1 gap-1 text-xs font-semibold text-[var(--charcoal)]">
                Availability
                <select value={filters.availability} onChange={(e) => setFilters((prev) => ({ ...prev, availability: e.target.value }))} className="min-h-10 w-full border border-[var(--beige)] bg-white px-3 py-2 text-sm font-normal text-[var(--charcoal)] outline-none">
                  <option value="">Any</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="LIMITED">Limited</option>
                  <option value="FULL">Full</option>
                </select>
              </label>

              <label className="grid min-w-0 flex-1 gap-1 text-xs font-semibold text-[var(--charcoal)]">
                Sort by
                <select value={filters.sort} onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value }))} className="min-h-10 w-full border border-[var(--beige)] bg-white px-3 py-2 text-sm font-normal text-[var(--charcoal)] outline-none">
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                  <option value="nearest">Nearest</option>
                  <option value="highest-rated">Highest rated</option>
                </select>
              </label>

              <button type="button" onClick={applyFilters} disabled={loading} className="min-h-10 w-full bg-[var(--charcoal)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                Apply filters
              </button>
              <button type="button" onClick={resetFilters} className="min-h-10 w-full border border-[var(--beige)] bg-white px-4 py-2 text-sm font-semibold text-[var(--charcoal)] hover:bg-[var(--warm-white)]">
                Reset
              </button>
            </div>
          </div> : null}
        </aside>

        <div className="space-y-5">
          {error ? <p role="alert" className="border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{error}<button onClick={() => setRetryKey((value) => value + 1)} className="ml-3 font-semibold underline">Retry</button></p> : null}

          <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
            {loading ? (
              <div className="col-span-full rounded-[24px] border border-[var(--beige)] bg-white p-8 text-center text-sm text-[var(--text-muted)]">Loading available homes...</div>
            ) : items.length === 0 ? (
              <div className="col-span-full rounded-[24px] border border-[var(--beige)] bg-white p-8 text-center text-sm text-[var(--text-muted)]">No listings match your filters yet.</div>
            ) : (
              items.map((listing) => (
                <Link key={listing.id} href={`/listings/${listing.id}`} className="group overflow-hidden rounded-[26px] border border-[var(--beige)] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                  <div className="relative h-32 overflow-hidden bg-[var(--cream)] sm:h-52">
                    <ListingImage src={listing.primaryPhoto || listing.photos?.[0]?.photoUrl} alt={listing.title} sizes="(max-width: 768px) 50vw, (max-width: 1280px) 50vw, 33vw" className="object-cover transition duration-300 group-hover:scale-105" />
                  </div>

                  <div className="p-2 sm:p-4">
                    <div className="flex min-w-0 items-start justify-between gap-1.5 sm:gap-3">
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-semibold text-[var(--charcoal)] sm:text-base">{listing.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-[var(--accent-sage)] sm:text-sm">{listing.campus?.name || 'Campus'}</p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-[var(--accent-terracotta)] sm:text-base">R{listing.pricePerMonth.toLocaleString()}</span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[10px] sm:mt-3 sm:text-xs">
                      <span className="font-medium text-[var(--accent-terracotta)]">{listing.accommodationType}</span>
                      <span className="font-medium text-[var(--success)]">{listing.availableRooms} rooms left</span>
                    </div>

                    <div className="mt-2 min-w-0 text-[10px] text-[var(--brown-dark)] sm:mt-4 sm:text-xs">
                      <p className="flex min-w-0 items-start gap-1.5">
                        <MapPin size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--accent-sage)]" />
                        <span className="min-w-0 break-words">{listing.address}</span>
                      </p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="text-[var(--brown-dark)]">{listing.distanceFromCampus.toFixed(1)} km from campus</span>
                        <span className="text-[var(--accent-sage)]">{listing.availabilityStatus}</span>
                      </div>
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
