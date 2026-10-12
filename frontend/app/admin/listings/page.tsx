'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthGuard } from '../../../components/auth-guard';
import { adminApi } from '../../../lib/api';
import type { Listing } from '../../../types';

const listingStatuses: Listing['approvalStatus'][] = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'];

function isListingStatus(status: string | null): status is Listing['approvalStatus'] {
  return status !== null && listingStatuses.some((listingStatus) => listingStatus === status);
}

function AdminListingsContent() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');
  const invalidFilter = statusParam !== null && !isListingStatus(statusParam);
  const status = isListingStatus(statusParam) ? statusParam : undefined;
  const filterKey = status ?? 'ALL';
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadedFilterKey, setLoadedFilterKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const loadingFilter = loadedFilterKey !== filterKey;
  const title = status ? `${status.charAt(0)}${status.slice(1).toLowerCase()} listings` : 'All listings';

  useEffect(() => {
    let active = true;
    if (invalidFilter) {
      return () => { active = false; };
    }

    adminApi.getListings(status).then((response) => {
      if (active) {
        setListings(response.data);
        setError('');
        setLoadedFilterKey(filterKey);
      }
    }).catch((err) => {
      if (active) {
        setError(err instanceof Error ? err.message : 'Unable to load listings.');
        setLoadedFilterKey(filterKey);
      }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filterKey, invalidFilter, reloadKey, status]);

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/admin/dashboard" className="text-sm font-semibold text-[var(--brown-dark)] hover:underline">Back to dashboard</Link>
        <header className="mt-5 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--beige)] pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-sage)]">Accommodation directory</p>
            <h1 className="mt-2 font-serif text-4xl text-[var(--charcoal)]">{title}</h1>
          </div>
          <button onClick={() => { setLoading(true); setError(''); setReloadKey((value) => value + 1); }} className="border border-[var(--beige)] px-3 py-2 text-sm font-semibold">Refresh</button>
        </header>
        {invalidFilter || error ? <p role="alert" className="mt-5 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{invalidFilter ? 'Invalid listing status filter.' : error}</p> : null}
        {!invalidFilter && (loading || loadingFilter) ? <p role="status" className="py-8 text-sm text-[var(--text-muted)]">Loading {title.toLowerCase()}...</p> : !invalidFilter && !error && listings.length === 0 ? <p className="py-8 text-sm text-[var(--text-muted)]">No matching listings.</p> : !invalidFilter && !error && !loading && !loadingFilter ? (
          <div className="mt-6 divide-y divide-[var(--beige)]">
            {listings.map((listing) => (
              <article key={listing.id} className="py-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 className="font-semibold text-[var(--charcoal)]">{listing.title}</h2>
                  <span className="border border-[var(--beige)] px-2 py-1 text-xs font-semibold">{listing.approvalStatus.replace('_', ' ')}</span>
                </div>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{listing.owner?.name ?? 'Landlord'} · {listing.campus.name}</p>
                <p className="mt-1 text-sm">{listing.address}</p>
                <p className="mt-1 text-sm font-semibold">R{listing.pricePerMonth.toLocaleString()} / month · {listing.accommodationType.replaceAll('_', ' ')}</p>
                {listing.rejectionReason ? <p className="mt-2 text-sm text-red-800">Rejection reason: {listing.rejectionReason}</p> : null}
              </article>
            ))}
          </div>
        ) : null}
      </main>
    </AuthGuard>
  );
}

export default function AdminListingsPage() {
  return <Suspense fallback={<p className="px-4 py-12 text-sm text-[var(--text-muted)]">Loading listing directory...</p>}><AdminListingsContent /></Suspense>;
}
