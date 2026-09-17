'use client';

import { useEffect, useState } from 'react';
import { AuthGuard } from '../../../components/auth-guard';
import { adminApi, campusApi } from '../../../lib/api';
import type { Campus, Listing } from '../../../types';

export default function AdminDashboardPage() {
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);

  useEffect(() => {
    async function load() {
      const [pendingRes, campusRes] = await Promise.all([
        adminApi.getPendingListings(),
        campusApi.getCampuses(true),
      ]);
      setPendingListings((pendingRes.data as Listing[]) || []);
      setCampuses((campusRes.data as Campus[]) || []);
    }
    load().catch(() => {});
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    if (action === 'approve') {
      await adminApi.approveListing(id);
    } else {
      await adminApi.rejectListing(id, 'Does not meet listing standards');
    }
    const res = await adminApi.getPendingListings();
    setPendingListings((res.data as Listing[]) || []);
  };

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-[28px] border border-[var(--beige)] bg-[var(--warm-white)] p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-sage)]">Admin dashboard</p>
          <h1 className="mt-2 font-serif text-4xl text-[var(--charcoal)]">Campus and listing oversight</h1>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-[24px] border border-[var(--beige)] bg-white p-6">
            <h2 className="font-serif text-2xl text-[var(--charcoal)]">Campuses</h2>
            <div className="mt-4 space-y-3">
              {campuses.map((campus) => (
                <div key={campus.id} className="flex items-center justify-between rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-4 py-3">
                  <div>
                    <p className="font-semibold text-[var(--charcoal)]">{campus.name}</p>
                    <p className="text-sm text-[var(--text-muted)]">{campus.location}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${campus.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'}`}>
                    {campus.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-[var(--beige)] bg-white p-6">
            <h2 className="font-serif text-2xl text-[var(--charcoal)]">Pending listing queue</h2>
            <div className="mt-4 space-y-3">
              {pendingListings.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No listings waiting for approval.</p>
              ) : (
                pendingListings.map((listing) => (
                  <div key={listing.id} className="rounded-2xl border border-[var(--beige)] bg-[var(--cream)] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--charcoal)]">{listing.title}</p>
                        <p className="text-sm text-[var(--text-muted)]">{listing.provider?.name ?? 'Landlord'} · {listing.campus?.name ?? 'Campus'}</p>
                      </div>
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">{listing.approvalStatus}</span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => handleAction(listing.id, 'approve')} className="rounded-xl bg-[var(--success)] px-3 py-2 text-xs font-semibold text-white">Approve</button>
                      <button onClick={() => handleAction(listing.id, 'reject')} className="rounded-xl bg-[var(--danger)] px-3 py-2 text-xs font-semibold text-white">Reject</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
