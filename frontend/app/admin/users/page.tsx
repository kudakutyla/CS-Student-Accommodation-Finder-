'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthGuard } from '../../../components/auth-guard';
import { adminApi } from '../../../lib/api';
import type { User } from '../../../types';

function AdminUsersContent() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');
  const role = roleParam === 'STUDENT' || roleParam === 'LANDLORD' ? roleParam : undefined;
  const verified = searchParams.get('verified') === 'true' ? true : undefined;
  const [users, setUsers] = useState<User[]>([]);
  const [loadedFilterKey, setLoadedFilterKey] = useState('');
  const [error, setError] = useState('');
  const filterKey = `${role || ''}:${verified === true ? 'true' : ''}`;
  const loading = loadedFilterKey !== filterKey;

  useEffect(() => {
    let active = true;
    adminApi.getUsers({ role, verified }).then((response) => {
      if (active) {
        setUsers(response.data);
        setError('');
        setLoadedFilterKey(filterKey);
      }
    }).catch((err) => {
      if (active) {
        setError(err instanceof Error ? err.message : 'Unable to load users.');
        setLoadedFilterKey(filterKey);
      }
    });
    return () => { active = false; };
  }, [filterKey, role, verified]);

  const title = verified ? 'Verified landlords' : role === 'STUDENT' ? 'Students' : role === 'LANDLORD' ? 'Landlords' : 'Users';

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/admin/dashboard" className="text-sm font-semibold text-[var(--brown-dark)] hover:underline">Back to dashboard</Link>
        <header className="mt-5 border-b border-[var(--beige)] pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-sage)]">Account directory</p>
          <h1 className="mt-2 font-serif text-4xl text-[var(--charcoal)]">{title}</h1>
        </header>
        {error ? <p role="alert" className="mt-5 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
        {loading ? <p role="status" className="py-8 text-sm text-[var(--text-muted)]">Loading {title.toLowerCase()}...</p> : users.length === 0 ? <p className="py-8 text-sm text-[var(--text-muted)]">No matching accounts.</p> : (
          <div className="mt-6 divide-y divide-[var(--beige)]">
            {users.map((user) => (
              <article key={user.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-semibold text-[var(--charcoal)]">{user.name}</p>
                  <p className="text-sm text-[var(--text-muted)]">{user.email}{user.phone ? ` · ${user.phone}` : ''}</p>
                  <p className="text-xs text-[var(--text-muted)]">{user.isActive ? 'Active' : 'Deactivated'}{user.role === 'LANDLORD' ? ` · ${user.isVerified ? 'Verified' : 'Unverified'}` : ''}</p>
                </div>
                <div className="flex gap-2">
                  {user.role === 'LANDLORD' ? <button onClick={() => void updateUser(user, { isVerified: !user.isVerified })} className="border border-[var(--beige)] px-2.5 py-1.5 text-xs font-semibold">{user.isVerified ? 'Revoke verification' : 'Verify landlord'}</button> : null}
                  <button onClick={() => void updateUser(user, { isActive: !user.isActive })} className="border border-[var(--beige)] px-2.5 py-1.5 text-xs font-semibold">{user.isActive ? 'Deactivate' : 'Activate'}</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </AuthGuard>
  );

  async function updateUser(user: User, data: { isVerified?: boolean; isActive?: boolean }) {
    setError('');
    try {
      const response = await adminApi.updateUser(user.id, data);
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, ...response.data } : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update this account.');
    }
  }
}

export default function AdminUsersPage() {
  return <Suspense fallback={<p className="px-4 py-12 text-sm text-[var(--text-muted)]">Loading account directory...</p>}><AdminUsersContent /></Suspense>;
}
