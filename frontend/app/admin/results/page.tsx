'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthGuard } from '../../../components/auth-guard';
import { adminApi, campusApi } from '../../../lib/api';
import type { Campus, Listing, User } from '../../../types';

const resultTypes = [
  'students',
  'landlords',
  'verified-landlords',
  'listings',
  'pending-listings',
  'approved-listings',
  'campuses',
] as const;

type ResultType = (typeof resultTypes)[number];

const resultTitles: Record<ResultType, string> = {
  students: 'Students',
  landlords: 'Landlords',
  'verified-landlords': 'Verified landlords',
  listings: 'All listings',
  'pending-listings': 'Pending listings',
  'approved-listings': 'Approved listings',
  campuses: 'Active campuses',
};

function isResultType(value: string | null): value is ResultType {
  return resultTypes.some((type) => type === value);
}

export default function AdminResultsPage() {
  return (
    <Suspense fallback={<p role="status" className="mx-auto max-w-6xl px-4 py-12 text-sm text-[var(--text-muted)]">Loading results...</p>}>
      <AdminResultsContent />
    </Suspense>
  );
}

function AdminResultsContent() {
  const searchParams = useSearchParams();
  const requestedType = searchParams.get('type');
  const type = isResultType(requestedType) ? requestedType : null;
  const [users, setUsers] = useState<User[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loadedType, setLoadedType] = useState<ResultType | null>(null);
  const [resultError, setResultError] = useState<{ type: ResultType; message: string } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState('');

  useEffect(() => {
    let active = true;
    if (!type) {
      return () => { active = false; };
    }

    const load = async () => {
      if (type === 'students' || type === 'landlords' || type === 'verified-landlords') {
        const response = await adminApi.getUsers();
        if (!active) return;
        const filteredUsers = response.data.filter((user) => {
          if (type === 'students') return user.role === 'STUDENT';
          if (type === 'verified-landlords') return user.role === 'LANDLORD' && user.isVerified;
          return user.role === 'LANDLORD';
        });
        setUsers(filteredUsers);
      } else if (type === 'campuses') {
        const response = await campusApi.getCampuses(true);
        if (active) setCampuses(response.data.filter((campus) => campus.isActive));
      } else {
        const status = type === 'pending-listings' ? 'PENDING' : type === 'approved-listings' ? 'APPROVED' : 'ALL';
        const response = await adminApi.getListings(status);
        if (active) setListings(response.data);
      }
      if (active) {
        setResultError(null);
        setLoadedType(type);
      }
    };

    load().catch((err) => {
      if (active) {
        setResultError({ type, message: err instanceof Error ? err.message : 'Unable to load results.' });
        setLoadedType(type);
      }
    });

    return () => { active = false; };
  }, [reloadKey, type]);

  const loading = !!type && loadedType !== type;
  const error = resultError?.type === type ? resultError.message : '';
  const isAccountResults = type === 'students' || type === 'landlords' || type === 'verified-landlords';
  const isListingResults = type === 'listings' || type === 'pending-listings' || type === 'approved-listings';
  const resultCount = isAccountResults ? users.length : isListingResults ? listings.length : campuses.length;

  async function toggleLandlordVerification(user: User) {
    setUpdatingUserId(user.id);
    setVerificationError('');
    try {
      const response = await adminApi.updateUser(user.id, { isVerified: !user.isVerified });
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, ...response.data } : item));
    } catch (err) {
      setVerificationError(err instanceof Error ? err.message : 'Unable to update landlord verification.');
    } finally {
      setUpdatingUserId(null);
    }
  }

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/admin/dashboard" className="text-sm font-semibold text-[var(--brown-dark)] hover:underline">← Back to dashboard</Link>
        <header className="mt-5 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--beige)] pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-sage)]">Dashboard results</p>
            <h1 className="mt-2 font-serif text-4xl text-[var(--charcoal)]">{type ? resultTitles[type] : 'Results'}</h1>
          </div>
          <button type="button" disabled={!type || loading} onClick={() => { setLoadedType(null); setResultError(null); setReloadKey((value) => value + 1); }} className="border border-[var(--beige)] px-3 py-2 text-sm font-semibold disabled:opacity-50">Refresh</button>
        </header>

        {!type ? <p role="alert" className="mt-5 text-sm text-red-800">Choose a results category from the Admin dashboard.</p> : null}
        {verificationError ? <p role="alert" className="mt-5 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{verificationError}</p> : null}
        {error ? <p role="alert" className="mt-5 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{error}<button type="button" onClick={() => { setLoadedType(null); setResultError(null); setReloadKey((value) => value + 1); }} className="ml-3 font-semibold underline">Retry</button></p> : null}
        {loading ? <p role="status" className="py-8 text-sm text-[var(--text-muted)]">Loading {type ? resultTitles[type].toLowerCase() : 'results'}...</p> : null}
        {!loading && type && !error && resultCount === 0 ? <p className="py-8 text-sm text-[var(--text-muted)]">No {resultTitles[type].toLowerCase()} found.</p> : null}

        {!loading && !error && isAccountResults ? (
          <div className="mt-4 divide-y divide-[var(--beige)]">
            {users.map((user) => (
              <article key={user.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <h2 className="font-semibold text-[var(--charcoal)]">{user.name}</h2>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{user.email}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{user.isActive ? 'Active' : 'Deactivated'}{user.role === 'LANDLORD' ? ` · ${user.isVerified ? 'Verified landlord' : 'Unverified landlord'}` : ''}</p>
                </div>
                {user.role === 'LANDLORD' ? (
                  <button
                    type="button"
                    disabled={updatingUserId === user.id}
                    onClick={() => void toggleLandlordVerification(user)}
                    className="border border-[var(--beige)] px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updatingUserId === user.id ? 'Updating...' : user.isVerified ? 'Revoke verification' : 'Verify landlord'}
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}

        {!loading && !error && isListingResults ? (
          <div className="mt-4 divide-y divide-[var(--beige)]">
            {listings.map((listing) => (
              <article key={listing.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div>
                  <h2 className="font-semibold text-[var(--charcoal)]">{listing.title}</h2>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{listing.owner?.name || 'Landlord'} · {listing.campus.name}</p>
                  <p className="mt-1 text-sm">{listing.address}</p>
                  <p className="mt-1 text-sm font-semibold">R{listing.pricePerMonth.toLocaleString()} / month · {listing.approvalStatus.replaceAll('_', ' ')}</p>
                </div>
                <Link href={`/listings/${listing.id}`} className="text-sm font-semibold text-[var(--brown-dark)] underline">View listing</Link>
              </article>
            ))}
          </div>
        ) : null}

        {!loading && !error && type === 'campuses' ? (
          <div className="mt-4 divide-y divide-[var(--beige)]">
            {campuses.map((campus) => (
              <article key={campus.id} className="py-4">
                <h2 className="font-semibold text-[var(--charcoal)]">{campus.name}</h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{campus.institution?.name || 'Institution not assigned'} · {campus.location}</p>
                <p className="mt-1 text-sm">{campus.address}</p>
              </article>
            ))}
            <Link href="/admin/campuses" className="inline-block py-4 text-sm font-semibold text-[var(--brown-dark)] underline">Manage campuses</Link>
          </div>
        ) : null}
      </main>
    </AuthGuard>
  );
}
