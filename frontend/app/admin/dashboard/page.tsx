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
    { label: 'Students', value: stats.totalStudents, href: '/admin/results?type=students' },
    { label: 'Landlords', value: stats.totalLandlords, href: '/admin/results?type=landlords' },
    { label: 'Verified landlords', value: stats.verifiedLandlords, href: '/admin/results?type=verified-landlords' },
    { label: 'Listings', value: stats.totalListings, href: '/admin/results?type=listings' },
    { label: 'Pending listings', value: stats.pendingListings, href: '/admin/results?type=pending-listings' },
    { label: 'Approved listings', value: stats.approvedListings, href: '/admin/results?type=approved-listings' },
    { label: 'Active campuses', value: stats.totalCampuses, href: '/admin/results?type=campuses' },
  ];

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--beige)] pb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-sage)]">Platform operations</p><h1 className="mt-2 font-serif text-4xl text-[var(--charcoal)]">Admin dashboard</h1></div><button onClick={() => { setLoading(true); setError(''); setReloadKey((value) => value + 1); }} className="border border-[var(--beige)] px-3 py-2 text-sm font-semibold">Refresh data</button></header>
        {error ? <p role="alert" className="mt-4 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{error}<button onClick={() => { setLoading(true); setReloadKey((value) => value + 1); }} className="ml-3 font-semibold underline">Retry</button></p> : null}
        {loading ? <p role="status" className="py-8 text-sm text-[var(--text-muted)]">Loading platform overview...</p> : <section aria-label="Platform statistics" className="grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-3">{metrics.map(({ label, value, href }) => <Link key={label} href={href} className="group border-b border-[var(--beige)] pb-4 outline-none transition-colors hover:border-[var(--accent-terracotta)] focus-visible:ring-2 focus-visible:ring-[var(--accent-terracotta)]"><p className="text-sm text-[var(--text-muted)] group-hover:text-[var(--charcoal)]">{label}</p><p className="mt-2 font-serif text-3xl text-[var(--charcoal)]">{value ?? 0}</p><span className="sr-only">View {label.toLowerCase()} results</span></Link>)}</section>}
      </main>
    </AuthGuard>
  );
}
