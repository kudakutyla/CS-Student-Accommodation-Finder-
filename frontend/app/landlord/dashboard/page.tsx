'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthGuard } from '../../../components/auth-guard';
import { campusApi, listingApi } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import type { Campus, Listing } from '../../../types';

export default function LandlordDashboardPage() {
  const { user } = useAuth();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0, availableRooms: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const [campusRes, listingRes] = await Promise.all([
        campusApi.getCampuses(),
        listingApi.getMyListings(),
      ]);
      setCampuses(campusRes.data || []);
      setListings(listingRes.data.items || []);
      setStats({
        total: listingRes.data.stats?.total || 0,
        approved: listingRes.data.stats?.approved || 0,
        pending: listingRes.data.stats?.pending || 0,
        rejected: listingRes.data.stats?.rejected || 0,
        availableRooms: listingRes.data.stats?.availableRooms || 0,
      });
    }
    load().catch(() => setError('We could not load your property workspace. Please refresh and try again.'));
  }, []);

  return (
    <AuthGuard allowedRoles={['LANDLORD']}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[30px] border border-[var(--beige)] bg-[radial-gradient(circle_at_top_right,_rgba(191,125,90,0.14),_transparent_38%),linear-gradient(135deg,#fdfaf7,#f3e8dd)] p-6 shadow-[0_24px_60px_rgba(92,74,56,0.08)] sm:p-8 lg:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-terracotta)]">Property workspace</p>
              <h1 className="mt-4 max-w-2xl font-serif text-4xl text-[var(--charcoal)] sm:text-5xl">Welcome back, {user?.name ?? 'landlord'}.</h1>
              <p className="mt-4 max-w-xl text-base text-[var(--text-muted)]">Keep your accommodation details current, track approval progress, and make every room easier for students to find.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/listings" className="inline-flex items-center justify-center rounded-2xl border border-[var(--beige)] bg-white/70 px-4 py-3 text-sm font-semibold text-[var(--charcoal)] hover:bg-white">View marketplace</Link>
              <Link href="/landlord/listings/create" className={`inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold text-white ${user?.isVerified ? 'bg-[var(--charcoal)] hover:bg-[var(--charcoal-mid)]' : 'cursor-not-allowed bg-[var(--charcoal)]/50'}`} aria-disabled={!user?.isVerified}>Add a property</Link>
            </div>
          </div>
        </section>

        {error ? <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ['All properties', stats.total],
            ['Published', stats.approved],
            ['Awaiting review', stats.pending],
            ['Needs attention', stats.rejected],
            ['Rooms available', stats.availableRooms],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[24px] border border-[var(--beige)] bg-white p-5 shadow-sm">
              <p className="text-sm text-[var(--text-muted)]">{label}</p>
              <p className="mt-3 font-serif text-3xl text-[var(--charcoal)]">{value}</p>
            </div>
          ))}
        </div>

        {!user?.isVerified ? (
          <div className="mt-8 rounded-[24px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
            Your landlord account must be verified before you can create or submit listings.
          </div>
        ) : null}

        <div className="mt-10 rounded-[28px] border border-[var(--beige)] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-sage)]">Portfolio</p>
              <h2 className="mt-2 font-serif text-3xl text-[var(--charcoal)]">Your properties</h2>
            </div>
            <span className="text-sm text-[var(--text-muted)]">{campuses.filter((c) => c.isActive).length} active campuses</span>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {listings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--sand)] bg-[var(--cream)] p-8 text-center lg:col-span-2">
                <p className="font-serif text-2xl text-[var(--charcoal)]">Your portfolio is ready for its first home.</p>
                <p className="mt-2 text-sm text-[var(--text-muted)]">Add a detailed property so students can discover it near their campus.</p>
              </div>
            ) : (
              listings.map((listing) => (
                <div key={listing.id} className="flex flex-col justify-between gap-5 rounded-2xl border border-[var(--beige)] bg-[var(--cream)] p-4 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-[var(--sand)]">
                      <img src={listing.primaryPhoto || listing.photos?.[0]?.photoUrl || 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=300&q=80'} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--charcoal)]">{listing.title}</p>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">{listing.campus?.name ?? 'Campus'} · {listing.availableRooms} of {listing.totalRooms} rooms available</p>
                      <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${listing.approvalStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : listing.approvalStatus === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>{listing.approvalStatus}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[var(--accent-terracotta)]">R{listing.pricePerMonth.toLocaleString()}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{listing.distanceFromCampus.toFixed(1)} km from campus</p>
                    <Link href={`/listings/${listing.id}`} className="mt-2 inline-block text-sm font-medium text-[var(--brown-dark)] hover:underline">View details</Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
