'use client';

import { FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ListingImage } from '../components/listing-image';
import { campusApi, listingApi } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import type { Campus, Institution, Listing } from '../types';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [campusId, setCampusId] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [accommodationType, setAccommodationType] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    Promise.all([
      campusApi.getInstitutions(),
      campusApi.getCampuses(),
      listingApi.searchListings({ limit: 3, sort: 'newest' }),
    ]).then(([institutionRes, campusRes, listingRes]) => {
      setInstitutions(institutionRes.data || []);
      setCampuses(campusRes.data || []);
      setListings(listingRes.data.items || []);
      setLoadError('');
    }).catch(() => {
      setLoadError('Live accommodation data is temporarily unavailable. Search all listings or try again shortly.');
    });
  }, [reloadKey]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (institutionId) params.set('institutionId', institutionId);
    if (campusId) params.set('campusId', campusId);
    if (accommodationType) params.set('type', accommodationType);
    if (maxPrice) params.set('maxPrice', maxPrice);
    const query = params.toString();
    const target = `/listings${query ? `?${query}` : ''}`;

    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(target)}`);
      return;
    }

    router.push(target);
  };

  return (
    <div className="overflow-hidden">
      <section className="relative isolate min-h-[min(760px,calc(100svh-64px))] overflow-hidden bg-[var(--charcoal)] text-white">
        <Image src="/images/campus-hero-exterior.jpg" alt="University campus building and grounds" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative mx-auto grid min-h-[min(760px,calc(100svh-64px))] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.78fr)] lg:px-8 lg:py-16">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f4d6c5]">Student accommodation finder</p>
            <h1 className="mt-5 max-w-lg font-serif text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">Find your place. Stay closer.</h1>
            <p className="mt-6 max-w-md text-base leading-7 text-white/90 sm:text-lg">Safe, verified accommodation near your campus. Browse homes from trusted landlords across South Africa.</p>
          </div>

          <form onSubmit={handleSearch} className="w-full max-w-md justify-self-start rounded-lg bg-[var(--warm-white)] p-5 text-[var(--charcoal)] shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-7 lg:justify-self-end">
            <h2 className="font-semibold text-lg">Find accommodation near your campus</h2>
            <div className="mt-5 grid gap-3">
              <label className="grid gap-1.5 text-xs font-medium text-[var(--text-muted)]">
                Institution
                <select value={institutionId} onChange={(event) => { setInstitutionId(event.target.value); setCampusId(''); }} className="min-h-12 w-full rounded-md border border-[var(--beige)] bg-white px-3 text-sm text-[var(--charcoal)] outline-none focus:border-[var(--accent-terracotta)]">
                  <option value="">Select an institution...</option>
                  {institutions.map((institution) => <option key={institution.id} value={institution.id}>{institution.name}</option>)}
                </select>
              </label>
              <label className="grid gap-1.5 text-xs font-medium text-[var(--text-muted)]">
                Campus
                <select value={campusId} onChange={(event) => setCampusId(event.target.value)} disabled={!institutionId} className="min-h-12 w-full rounded-md border border-[var(--beige)] bg-white px-3 text-sm text-[var(--charcoal)] outline-none focus:border-[var(--accent-terracotta)] disabled:opacity-60">
                  <option value="">{institutionId ? 'Select your campus...' : 'Select an institution first'}</option>
                  {campuses.filter((campus) => campus.institutionId === institutionId).map((campus) => <option key={campus.id} value={campus.id}>{campus.name}</option>)}
                </select>
              </label>
              <label className="grid gap-1.5 text-xs font-medium text-[var(--text-muted)]">
                Accommodation type
                <select value={accommodationType} onChange={(event) => setAccommodationType(event.target.value)} className="min-h-12 w-full rounded-md border border-[var(--beige)] bg-white px-3 text-sm text-[var(--charcoal)] outline-none focus:border-[var(--accent-terracotta)]">
                  <option value="">Any accommodation type</option>
                  {['ROOM', 'SHARED_ROOM', 'APARTMENT', 'BACHELOR', 'STUDIO', 'HOUSE', 'SHARED_HOUSE', 'STUDENT_RESIDENCE'].map((type) => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}
                </select>
              </label>
              <label className="grid gap-1.5 text-xs font-medium text-[var(--text-muted)]">
                Maximum budget per month
                <input type="number" min="1" inputMode="numeric" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Maximum budget (R/month)" className="min-h-12 w-full rounded-md border border-[var(--beige)] bg-white px-3 text-sm text-[var(--charcoal)] outline-none focus:border-[var(--accent-terracotta)]" />
              </label>
            </div>
            <button type="submit" className="mt-4 min-h-12 w-full rounded-md bg-[var(--charcoal)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--charcoal-mid)]">Search Now</button>
          </form>
        </div>
      </section>

      {loadError ? <p role="status" className="flex flex-wrap items-center justify-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">{loadError}<button onClick={() => setReloadKey((current) => current + 1)} className="font-semibold underline">Retry</button></p> : null}

      <section className="border-b border-[var(--beige)] bg-[var(--warm-white)]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-8">
          <div><p className="font-serif text-3xl text-[var(--charcoal)]">{campuses.length}</p><p className="mt-1 text-sm text-[var(--text-muted)]">campus communities</p></div>
          <div><p className="font-serif text-3xl text-[var(--charcoal)]">{listings.length}</p><p className="mt-1 text-sm text-[var(--text-muted)]">featured homes</p></div>
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
            <Link key={campus.id} href={`/listings?institutionId=${campus.institutionId || ''}&campusId=${campus.id}`} className="group relative min-h-64 overflow-hidden rounded-lg bg-[var(--charcoal)]">
              <Image src={`/images/campus-${(index % 3) + 1}.jpg`} alt="" fill sizes="(max-width: 768px) 100vw, 25vw" className="object-cover opacity-80 transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/45" />
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
              <Link key={listing.id} href={`/listings/${listing.id}`} className="group overflow-hidden rounded-lg bg-white shadow-[0_12px_30px_rgba(92,74,56,0.07)]">
                <div className="group relative h-56 overflow-hidden bg-[var(--sand)]"><ListingImage src={listing.primaryPhoto || listing.photos?.[0]?.photoUrl} alt={listing.title} sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" /></div>
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
