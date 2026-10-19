'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ListingImage } from '../components/listing-image';
import { campusApi, listingApi } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import type { Campus, Listing, PublicCampusStats } from '../types';

const heroImages = [
  '/images/campus-hero-exterior.jpg',
  '/images/campus-1.jpg',
  '/images/campus-2.jpg',
  '/images/campus-3.jpg',
  '/images/student-home-1.jpg',
  '/images/student-home-2.jpg',
];
const heroEyebrowText = 'Student accommodation finder';

export default function Home() {
  const { isLoading } = useAuth();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [publicStats, setPublicStats] = useState<PublicCampusStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [typedHeroEyebrow, setTypedHeroEyebrow] = useState('');
  const [campusError, setCampusError] = useState('');
  const [listingError, setListingError] = useState('');
  const [statsError, setStatsError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const retryData = () => {
    setStatsLoading(true);
    setReloadKey((current) => current + 1);
  };

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let characterIndex = 0;
    let typingIntervalId: number | undefined;
    const startTyping = () => {
      characterIndex = 0;
      setTypedHeroEyebrow('');
      typingIntervalId = window.setInterval(() => {
        characterIndex += 1;
        setTypedHeroEyebrow(heroEyebrowText.slice(0, characterIndex));

        if (characterIndex >= heroEyebrowText.length && typingIntervalId !== undefined) {
          window.clearInterval(typingIntervalId);
        }
      }, 55);
    };

    startTyping();
    const replayIntervalId = window.setInterval(startTyping, 30_000);

    return () => {
      window.clearInterval(replayIntervalId);
      if (typingIntervalId !== undefined) window.clearInterval(typingIntervalId);
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const intervalId = window.setInterval(() => {
      setHeroImageIndex((current) => (current + 1) % heroImages.length);
    }, 2000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    let active = true;
    Promise.allSettled([
      campusApi.getCampuses(),
      listingApi.searchListings({ limit: 3, sort: 'newest' }),
      campusApi.getPublicStats(),
    ]).then(([campusResult, listingResult, statsResult]) => {
      if (!active) return;
      setCampusError(campusResult.status === 'rejected'
        ? 'Campus communities could not be loaded. Please retry.'
        : '');
      setCampuses(campusResult.status === 'fulfilled' ? campusResult.value.data || [] : []);
      if (listingResult.status === 'fulfilled') {
        setListings(listingResult.value.data.items || []);
        setListingError('');
      } else {
        setListingError('Approved accommodation could not be loaded. Please retry or search all listings.');
        setListings([]);
      }
      if (statsResult.status === 'fulfilled') {
        const stats = statsResult.value.data;
        if (stats && typeof stats.campusCount === 'number' && typeof stats.approvedListingCount === 'number') {
          setPublicStats(stats);
          setStatsError('');
        } else {
          console.error('Public accommodation statistics response did not include valid totals.');
          setPublicStats(null);
          setStatsError('The totals service returned an invalid response.');
        }
      } else {
        setPublicStats(null);
        console.error('Public accommodation statistics request failed:', statsResult.reason);
        setStatsError('The totals service could not be reached.');
      }
      setStatsLoading(false);
    });
    return () => { active = false; };
  }, [isLoading, reloadKey]);

  if (isLoading) {
    return <main className="flex flex-1 items-center justify-center text-sm text-[var(--text-muted)]" role="status">Loading homepage...</main>;
  }

  return (
    <div className="overflow-hidden">
      <section className="relative isolate min-h-[min(460px,calc(100svh-64px))] overflow-hidden bg-[var(--charcoal)] text-white sm:min-h-[480px]">
        <Image src={heroImages[heroImageIndex]} alt="" aria-hidden="true" fill priority sizes="100vw" className="scale-110 object-cover blur-sm brightness-50 transition-opacity duration-1000 motion-reduce:transition-none" />
        {heroImages.map((image, index) => (
          <Image
            key={image}
            src={image}
            alt=""
            aria-hidden="true"
            fill
            priority={index === 0}
            sizes="100vw"
            className={`object-cover transition-opacity duration-1000 motion-reduce:transition-none ${index === heroImageIndex ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative mx-auto flex min-h-[inherit] max-w-7xl items-center px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f4d6c5]">
              <span aria-hidden="true" className="motion-reduce:hidden">{typedHeroEyebrow}</span>
              <span aria-hidden="true" className="hidden motion-reduce:inline">{heroEyebrowText}</span>
              <span className="sr-only">{heroEyebrowText}</span>
            </p>
            <h1 className="mt-5 font-serif text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">Find your place. Stay closer.</h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-white/90 sm:text-lg">Safe, verified accommodation near your campus. Browse homes from trusted landlords across South Africa.</p>
          </div>
        </div>
      </section>

      {campusError ? <p role="status" className="flex flex-wrap items-center justify-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">{campusError}<button onClick={retryData} className="font-semibold underline">Retry</button></p> : null}
      {listingError ? <p role="alert" className="flex flex-wrap items-center justify-center gap-3 border-b border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-900">{listingError}<button onClick={retryData} className="font-semibold underline">Retry</button></p> : null}
      {statsError ? <p role="alert" className="flex flex-wrap items-center justify-center gap-3 border-b border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-900">Campus and accommodation totals could not be loaded. {statsError}<button onClick={retryData} className="font-semibold underline">Retry</button></p> : null}

      <section className="border-b border-[var(--beige)] bg-[var(--warm-white)]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="grid grid-cols-3 gap-2 text-center sm:gap-6">
            <div><p className="font-serif text-2xl text-[var(--charcoal)] sm:text-3xl" aria-label={statsLoading ? 'Loading campus count' : statsError ? 'Campus count unavailable' : `${publicStats?.campusCount} campuses`}>{statsLoading ? '…' : statsError ? 'Unavailable' : publicStats?.campusCount}</p><p className="mt-1 text-xs leading-4 text-[var(--text-muted)] sm:text-sm sm:leading-5">campus communities</p></div>
            <div><p className="font-serif text-2xl text-[var(--charcoal)] sm:text-3xl" aria-label={statsLoading ? 'Loading approved home count' : statsError ? 'Approved home count unavailable' : `${publicStats?.approvedListingCount} approved homes`}>{statsLoading ? '…' : statsError ? 'Unavailable' : publicStats?.approvedListingCount}</p><p className="mt-1 text-xs leading-4 text-[var(--text-muted)] sm:text-sm sm:leading-5">featured homes</p></div>
            <div><p className="font-serif text-2xl text-[var(--charcoal)] sm:text-3xl">100%</p><p className="mt-1 text-xs leading-4 text-[var(--text-muted)] sm:text-sm sm:leading-5">focused on student living</p></div>
          </div>
        </div>
      </section>

      <section aria-label="Student journey" className="bg-[var(--cream)] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-2xl border border-[var(--journey-border)] bg-[var(--journey-bg)] px-3 py-4 shadow-[0_8px_24px_rgba(92,74,56,0.06)] sm:px-6 sm:py-5">
          <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--brown-mid)] sm:mb-4 sm:text-xs">Your student journey</p>
          <ol className="mx-auto grid max-w-3xl grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-center gap-1 text-center sm:gap-3">
            <li className="text-xs font-semibold text-[var(--charcoal)] sm:text-base">Search</li>
            <li aria-hidden="true" className="text-xs text-[var(--accent-sage)] sm:text-base">→</li>
            <li className="text-xs font-semibold text-[var(--charcoal)] sm:text-base">Discover</li>
            <li aria-hidden="true" className="text-xs text-[var(--accent-sage)] sm:text-base">→</li>
            <li className="text-xs font-semibold text-[var(--charcoal)] sm:text-base">Compare</li>
            <li aria-hidden="true" className="text-xs text-[var(--accent-sage)] sm:text-base">→</li>
            <li className="text-xs font-semibold text-[var(--charcoal)] sm:text-base">Contact.</li>
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-5 pb-16 sm:px-6 sm:pt-7 lg:px-8 lg:pt-10 lg:pb-20">
        <div className="relative flex flex-row items-end justify-between gap-2 sm:gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-sage)]">Start close to campus</p>
            <h2 className="mt-3 font-serif text-3xl text-[var(--charcoal)] sm:text-4xl">Explore where you could <span className="block sm:inline">live</span></h2>
          </div>
          <Link href="/listings" className="absolute right-0 bottom-0 inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-semibold text-[var(--brown-dark)] underline underline-offset-4 hover:underline sm:static sm:text-sm">
            View all accommodation<span aria-hidden="true" className="text-sm leading-none">→</span>
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
          {campuses.slice(0, 4).map((campus, index) => (
            <Link key={campus.id} href={`/listings?institutionId=${campus.institutionId || ''}&campusId=${campus.id}`} className="group relative min-h-64 overflow-hidden rounded-lg bg-[var(--charcoal)]">
              <Image src={`/images/campus-${(index % 3) + 1}.jpg`} alt="" fill sizes="(max-width: 768px) 100vw, 25vw" className="object-cover opacity-80 transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/5" />
              <div className="relative flex h-full min-h-64 flex-col justify-between p-3 text-white sm:p-5">
                <p className="w-fit rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white sm:text-xs">
                  {campus.listingCount ?? 0} homes
                </p>
                <div className="max-w-full">
                  <h3 className="line-clamp-3 font-serif text-base leading-tight sm:text-2xl">{campus.name}</h3>
                  <p className="mt-1 text-xs text-white/85 sm:text-sm">{campus.location}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[var(--warm-white)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="relative flex flex-row items-end justify-between gap-2 sm:gap-4">
            <div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-terracotta)]">A considered shortlist</p><h2 className="mt-3 font-serif text-4xl text-[var(--charcoal)]">Homes worth looking <span className="block sm:inline">at</span></h2></div>
            <Link href="/listings" className="absolute right-0 bottom-0 inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-semibold text-[var(--brown-dark)] underline underline-offset-4 hover:underline sm:static sm:text-sm">
              Explore the full collection<span aria-hidden="true" className="text-sm leading-none">→</span>
            </Link>
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
        <Link href="/register?role=LANDLORD" className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-[var(--charcoal)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--charcoal-mid)]">List your property</Link>
      </section>
    </div>
  );
}
