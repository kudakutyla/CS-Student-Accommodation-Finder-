'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bookmark, Search } from 'lucide-react';
import { ListingImage } from '../../../components/listing-image';
import { AuthGuard } from '../../../components/auth-guard';
import { campusApi, listingApi } from '../../../lib/api';
import { getOfficialInstitutionLogo } from '../../../lib/institution-logos';
import type { Campus, Listing } from '../../../types';

const campusBackgroundImages: Record<string, string> = {
  'sol plaatje university|sol plaatje university (north campus)':
    'https://www.spu.ac.za/wp-content/uploads/2026/02/signature-picture.jpg',
  'nelson mandela university|south campus':
    'https://www.mandela.ac.za/www/media/Store/images/On%20campus/Campus%20information%20and%20maps/South.jpg',
  'university of cape town|university of cape town':
    'https://uct.ac.za/sites/default/files/content_migration/uct_ac_za/49/images/UCT_view-from-plaza-on-upper-campus.jpg',
  'university of limpopo|university of limpopo (turfloop campus)':
    'https://www.ul.ac.za/wp-content/uploads/2023/10/Campus.png',
  'university of mpumalanga|university of mpumalanga (mbombela campus)':
    'https://www.ump.ac.za/getmedia/35bf35e7-676d-4457-a550-93a1aa1f11ef/CampusM.jpg.aspx',
  'university of pretoria|university of pretoria (hatfield)':
    'https://virtualcampus.up.ac.za/wp-content/uploads/2018/06/hatfield.jpg',
  'university of south africa|university of south africa (muckleneuk campus)':
    'https://www.unisa.ac.za/static/corporate_web/Content/About/Unisa%20Visitors%20Guide/images/unisa-campuses-muckleneuk.jpg',
  'university of the witwatersrand|university of the witwatersrand':
    'https://www.wits.ac.za/media/wits-university/centenary/images/priorities/Panorama-view-of-Braamfontein-campus.png',
};

function getCampusBackgroundImage(campus: Campus): string | null {
  const key = `${campus.institution?.name ?? ''}|${campus.name}`.trim().toLowerCase();
  return campusBackgroundImages[key] ?? null;
}

function CampusBackground({ campus }: { campus: Campus }) {
  const [failed, setFailed] = useState(false);
  const imageUrl = getCampusBackgroundImage(campus);

  if (!imageUrl || failed) {
    return (
      <InstitutionLogo
        campus={campus}
        className="absolute inset-0 flex h-full w-full items-center justify-center rounded-none bg-[var(--warm-white)] p-8 object-contain opacity-70"
      />
    );
  }

  return (
    <Image
      src={imageUrl}
      alt=""
      aria-hidden="true"
      fill
      unoptimized
      sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
      onError={() => setFailed(true)}
      className="object-cover transition duration-300 group-hover:scale-105"
    />
  );
}

function InstitutionLogo({ campus, className }: { campus: Campus; className?: string }) {
  const [failed, setFailed] = useState(false);
  const logoUrl = campus.institution?.logoUrl || getOfficialInstitutionLogo(campus.institution?.name);

  if (!logoUrl || failed) {
    return (
      <span aria-hidden="true" className={className ?? 'flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--warm-white)] font-serif text-xl font-semibold text-[var(--charcoal)]'}>
        {(campus.institution?.shortName || campus.institution?.name || campus.name).slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <Image
      src={logoUrl}
      alt={`${campus.institution?.name || campus.name} logo`}
      width={192}
      height={96}
      unoptimized
      onError={() => setFailed(true)}
      className={className ?? 'h-16 w-36 rounded-2xl bg-[var(--warm-white)] p-1 object-contain'}
    />
  );
}

export default function StudentDashboardPage() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [campusesLoading, setCampusesLoading] = useState(true);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [campusError, setCampusError] = useState('');
  const [featuredError, setFeaturedError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      setCampusesLoading(true);
      setFeaturedLoading(true);
      const [campusResult, listingResult] = await Promise.allSettled([
        campusApi.getCampuses(),
        listingApi.searchListings({ limit: 4, sort: 'newest' }),
      ]);

      if (campusResult.status === 'fulfilled') {
        if (active) {
          setCampuses(campusResult.value.data || []);
          setCampusError('');
        }
      } else {
        if (active) {
          setCampuses([]);
          setCampusError(campusResult.reason instanceof Error ? campusResult.reason.message : 'Unable to load popular campuses.');
        }
      }
      if (active) {
        setCampusesLoading(false);
      }

      if (listingResult.status === 'fulfilled') {
        if (active) {
          setFeatured(listingResult.value.data.items || []);
          setFeaturedError('');
        }
      } else {
        if (active) {
          setFeatured([]);
          setFeaturedError(listingResult.reason instanceof Error ? listingResult.reason.message : 'Unable to load the latest homes.');
        }
      }
      if (active) {
        setFeaturedLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, [reloadKey]);

  return (
    <AuthGuard allowedRoles={['STUDENT']}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[30px] border border-[var(--beige)] bg-[radial-gradient(circle_at_top_left,_rgba(122,145,117,0.12),_transparent_35%),linear-gradient(135deg,var(--warm-white),var(--cream))] p-4 shadow-[0_16px_40px_rgba(92,74,56,0.07)] sm:p-6 lg:p-7">
          <div>
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-sage)]">Student dashboard</p>
              <h1 className="mt-2 font-serif text-3xl text-[var(--charcoal)] sm:text-4xl">Find a place that feels like home.</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-muted)] sm:text-base">
                Compare verified homes near campus, filter by price and distance, and discover accommodation built for student life.
              </p>
            </div>

            <div className="mt-4 flex flex-row justify-center gap-2 sm:gap-3">
              <Link
                href="/listings"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[var(--charcoal)] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[var(--charcoal-mid)] sm:text-sm"
              >
                <Search size={16} aria-hidden="true" />
                Search homes
              </Link>
              <Link
                href="/student/favourites"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[var(--charcoal)] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[var(--charcoal-mid)] sm:text-sm"
              >
                <Bookmark size={16} aria-hidden="true" />
                Saved homes
              </Link>
            </div>
          </div>
        </section>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-[var(--charcoal)] sm:justify-start sm:gap-3 sm:text-sm">
          <span className="rounded-full bg-[var(--beige)] px-4 py-2">Verified listings</span>
          <span className="rounded-full bg-[var(--beige)] px-4 py-2">Near campus</span>
          <span className="rounded-full bg-[var(--beige)] px-4 py-2">Secure options</span>
        </div>

        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="font-serif text-3xl text-[var(--charcoal)]">Popular campuses</h2>
            <Link href="/listings" className="text-sm font-semibold text-[var(--brown-dark)] hover:underline">Browse all listings</Link>
          </div>

          {campusError ? (
            <p role="alert" className="border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">
              {campusError}
              <button onClick={() => setReloadKey((value) => value + 1)} className="ml-3 font-semibold underline">Retry</button>
            </p>
          ) : null}
          {campusesLoading ? <p role="status" className="py-6 text-sm text-[var(--text-muted)]">Loading popular campuses...</p> : null}
          {!campusesLoading && !campusError && campuses.length === 0 ? (
            <p className="border border-[var(--beige)] bg-white p-5 text-sm text-[var(--text-muted)]">No active campuses are available right now.</p>
          ) : null}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {campuses.map((campus) => (
              <Link
                key={campus.id}
                href={`/listings?institutionId=${campus.institutionId || ''}&campusId=${campus.id}`}
                className="group rounded-[24px] border border-[var(--beige)] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--sand)]"
              >
                <div className="relative h-36 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,var(--sand),var(--beige))]">
                  <CampusBackground key={campus.id} campus={campus} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/20" />
                  <div className="relative flex h-full flex-col items-center justify-between p-3">
                    <InstitutionLogo key={`${campus.id}:${campus.institution?.logoUrl || ''}`} campus={campus} />
                    <div className="flex w-full items-center justify-between text-white">
                      <span className="rounded-full bg-black/45 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em]">Campus</span>
                      <span className="rounded-full bg-[var(--charcoal)] px-2.5 py-1 text-[10px] font-semibold text-white">{campus.listingCount ?? 0}</span>
                    </div>
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
            <h2 className="font-serif text-3xl text-[var(--charcoal)]">Latest approved homes</h2>
            <Link href="/listings" className="text-sm font-semibold text-[var(--brown-dark)] hover:underline">View all</Link>
          </div>

          {featuredError ? (
            <p role="alert" className="border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">
              {featuredError}
              <button onClick={() => setReloadKey((value) => value + 1)} className="ml-3 font-semibold underline">Retry</button>
            </p>
          ) : null}
          {featuredLoading ? <p role="status" className="py-6 text-sm text-[var(--text-muted)]">Loading latest homes...</p> : null}
          {!featuredLoading && !featuredError && featured.length === 0 ? (
            <p className="border border-[var(--beige)] bg-white p-5 text-sm text-[var(--text-muted)]">There are no approved homes available right now. Check back soon or browse all listings.</p>
          ) : null}
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

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-white">
                    <span className="rounded-md bg-[var(--accent-terracotta)] px-2.5 py-1.5">{listing.accommodationType.replaceAll('_', ' ')}</span>
                    <span className="rounded-md bg-[var(--accent-terracotta)] px-2.5 py-1.5">{listing.availableRooms} rooms available</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="rounded-full bg-[var(--beige)] px-2 py-1 text-[var(--brown-dark)]">{listing.distanceFromCampus.toFixed(1)} km</span>
                    <span className="font-medium text-[var(--charcoal)]">
                      {listing.reviewCount > 0 && listing.averageRating > 0
                        ? `${listing.averageRating.toFixed(1)} ★`
                        : 'No reviews yet'}
                    </span>
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
