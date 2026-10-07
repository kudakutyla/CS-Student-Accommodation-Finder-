'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthGuard } from '../../../components/auth-guard';
import { adminApi } from '../../../lib/api';

type AdminStats = Record<string, number>;

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    adminApi.getAdminStats().then((statsResponse) => {
      if (active) {
        setStats(statsResponse.data);
      }
    }).catch((err) => {
      if (active) setError(err instanceof Error ? err.message : 'Unable to load administrator overview.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  const metrics = [
    { label: 'Students', value: stats.totalStudents, href: '/admin/users?role=STUDENT' },
    { label: 'Landlords', value: stats.totalLandlords, href: '/admin/users?role=LANDLORD' },
    { label: 'Verified landlords', value: stats.verifiedLandlords, href: '/admin/users?role=LANDLORD&verified=true' },
    { label: 'Listings', value: stats.totalListings, href: '/admin/listings' },
    { label: 'Pending listings', value: stats.pendingListings, href: '/admin/pending-listings' },
    { label: 'Approved listings', value: stats.approvedListings, href: '/admin/listings?status=APPROVED' },
    { label: 'Draft listings', value: stats.draftListings },
    { label: 'Rejected listings', value: stats.rejectedListings },
    { label: 'Active campuses', value: stats.totalCampuses, href: '/admin/campuses' },
  ];

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--beige)] pb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-sage)]">Platform operations</p><h1 className="mt-2 font-serif text-4xl text-[var(--charcoal)]">Admin dashboard</h1></div><button onClick={() => { setLoading(true); setError(''); setReloadKey((value) => value + 1); }} className="border border-[var(--beige)] px-3 py-2 text-sm font-semibold">Refresh data</button></header>
        {error ? <p role="alert" className="mt-4 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{error}<button onClick={() => { setLoading(true); setReloadKey((value) => value + 1); }} className="ml-3 font-semibold underline">Retry</button></p> : null}
        {loading ? <p role="status" className="py-8 text-sm text-[var(--text-muted)]">Loading platform overview...</p> : <section aria-label="Platform statistics" className="grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-3">{metrics.map(({ label, value, href }) => {
          const content = <><p className="text-sm text-[var(--text-muted)]">{label}</p><p className="mt-2 font-serif text-3xl text-[var(--charcoal)]">{value ?? 0}</p>{href ? <span className="mt-3 inline-block text-xs font-semibold text-[var(--brown-dark)] underline underline-offset-4">View results</span> : null}</>;
          return href ? <Link key={label} href={href} aria-label={`View ${label.toLowerCase()} results`} className="rounded-xl border border-[var(--beige)] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent-terracotta)] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-terracotta)]">{content}</Link> : <div key={label} className="rounded-xl border border-[var(--beige)] bg-white p-5 shadow-sm"><p className="text-sm text-[var(--text-muted)]">{label}</p><p className="mt-2 font-serif text-3xl text-[var(--charcoal)]">{value ?? 0}</p></div>;
        })}</section>}
      </main>
    </AuthGuard>
  );
}
