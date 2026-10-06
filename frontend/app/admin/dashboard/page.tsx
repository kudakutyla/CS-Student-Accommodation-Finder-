'use client';

import { useEffect, useState } from 'react';
import { AuthGuard } from '../../../components/auth-guard';
import { adminApi } from '../../../lib/api';
import type { User } from '../../../types';

type AdminStats = Record<string, number>;

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({});
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([adminApi.getAdminStats(), adminApi.getUsers()]).then(([statsResponse, userResponse]) => {
      if (active) {
        setStats(statsResponse.data);
        setUsers(userResponse.data);
      }
    }).catch((err) => {
      if (active) setError(err instanceof Error ? err.message : 'Unable to load administrator overview.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  const metrics = [
    ['Students', stats.totalStudents],
    ['Landlords', stats.totalLandlords],
    ['Verified landlords', stats.verifiedLandlords],
    ['Listings', stats.totalListings],
    ['Pending listings', stats.pendingListings],
    ['Approved listings', stats.approvedListings],
    ['Active campuses', stats.totalCampuses],
  ];

  async function updateUser(user: User, data: { isVerified?: boolean; isActive?: boolean }) {
    setError('');
    try {
      const response = await adminApi.updateUser(user.id, data);
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, ...response.data } : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update this account.');
    }
  }

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--beige)] pb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-sage)]">Platform operations</p><h1 className="mt-2 font-serif text-4xl text-[var(--charcoal)]">Admin dashboard</h1></div><button onClick={() => { setLoading(true); setError(''); setReloadKey((value) => value + 1); }} className="border border-[var(--beige)] px-3 py-2 text-sm font-semibold">Refresh data</button></header>
        {error ? <p role="alert" className="mt-4 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{error}<button onClick={() => { setLoading(true); setReloadKey((value) => value + 1); }} className="ml-3 font-semibold underline">Retry</button></p> : null}
        {loading ? <p role="status" className="py-8 text-sm text-[var(--text-muted)]">Loading platform overview...</p> : <section aria-label="Platform statistics" className="grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-3">{metrics.map(([label, value]) => <div key={label} className="border-b border-[var(--beige)] pb-4"><p className="text-sm text-[var(--text-muted)]">{label}</p><p className="mt-2 font-serif text-3xl text-[var(--charcoal)]">{value ?? 0}</p></div>)}</section>}
        <section className="border-t border-[var(--beige)] py-8"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-terracotta)]">Account trust</p><h2 className="mt-1 font-serif text-2xl">Students and landlords</h2><div className="mt-4 divide-y divide-[var(--beige)]">{users.map((managedUser) => <article key={managedUser.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-semibold">{managedUser.name} <span className="text-xs font-normal text-[var(--text-muted)]">{managedUser.role}</span></p><p className="text-sm text-[var(--text-muted)]">{managedUser.email}</p><p className="text-xs text-[var(--text-muted)]">{managedUser.isActive ? 'Active' : 'Deactivated'}{managedUser.role === 'LANDLORD' ? ` · ${managedUser.isVerified ? 'Verified' : 'Unverified'}` : ''}</p></div><div className="flex flex-wrap gap-2">{managedUser.role === 'LANDLORD' ? <button onClick={() => void updateUser(managedUser, { isVerified: !managedUser.isVerified })} className="border border-[var(--beige)] px-2.5 py-1.5 text-xs font-semibold">{managedUser.isVerified ? 'Revoke verification' : 'Verify landlord'}</button> : null}<button onClick={() => void updateUser(managedUser, { isActive: !managedUser.isActive })} className="border border-[var(--beige)] px-2.5 py-1.5 text-xs font-semibold">{managedUser.isActive ? 'Deactivate' : 'Activate'}</button></div></article>)}</div></section>
      </main>
    </AuthGuard>
  );
}
