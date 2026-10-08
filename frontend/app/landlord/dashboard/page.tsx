'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthGuard } from '../../../components/auth-guard';
import { listingApi } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import type { Listing } from '../../../types';

export default function LandlordDashboardPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0, availableRooms: 0, availableRoomsByType: {} as Record<string, number> });
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const listingRes = await listingApi.getMyListings();
      setListings(listingRes.data.items || []);
      setStats({
        total: listingRes.data.stats?.total || 0,
        approved: listingRes.data.stats?.approved || 0,
        pending: listingRes.data.stats?.pending || 0,
        rejected: listingRes.data.stats?.rejected || 0,
        availableRooms: listingRes.data.stats?.availableRooms || 0,
        availableRoomsByType: listingRes.data.stats?.availableRoomsByType || {},
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
              <Link href="/listings" className="inline-flex items-center justify-center rounded-2xl border border-[var(--beige)] bg-white/70 px-4 py-3 text-sm font-semibold text-[var(--charcoal)] hover:bg-white">View Market</Link>
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

        <section className="mt-8 rounded-[28px] border border-[var(--beige)] bg-white p-6 shadow-sm sm:p-8" aria-labelledby="room-statistics-heading">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-sage)]">Inventory</p>
          <h2 id="room-statistics-heading" className="mt-2 font-serif text-2xl text-[var(--charcoal)]">Available rooms by type</h2>
          {Object.keys(stats.availableRoomsByType).length ? <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Object.entries(stats.availableRoomsByType).map(([type, count]) => {
            const label = type === 'ROOM' ? 'Single room' : type === 'SHARED_ROOM' ? 'Shared room' : type.replaceAll('_', ' ').toLowerCase();
            return <div key={type} className="border-b border-[var(--beige)] pb-3"><p className="text-sm capitalize text-[var(--text-muted)]">{label}</p><p className="mt-1 font-serif text-2xl text-[var(--charcoal)]">{count}</p></div>;
          })}</div> : <p className="mt-3 text-sm text-[var(--text-muted)]">No available rooms yet.</p>}
        </section>

        {!user?.isVerified ? (
          <div className="mt-8 rounded-[24px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
            Your landlord account must be verified before you can create or submit listings.
          </div>
        ) : null}

        <div className="mt-8 rounded-[28px] border border-[var(--beige)] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-sage)]">Landlord rating</p>
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            {(() => {
              const ratings = listings.filter((listing) => listing.reviewCount > 0).map((listing) => listing.averageRating);
              const average = ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : null;

              if (average === null) {
                return <span className="text-lg font-semibold text-[var(--charcoal)]">New landlord</span>;
              }

              const stars = Array.from({ length: 5 }, (_, index) => index < Math.round(average) ? '★' : '☆');
              return (
                <>
                  <span className="text-xl tracking-widest text-[var(--accent-terracotta)]">{stars.join('')}</span>
                  <span className="text-sm font-semibold text-[var(--charcoal)]">{average.toFixed(1)} / 5</span>
                </>
              );
            })()}
          </div>
        </div>

      </div>
    </AuthGuard>
  );
}
