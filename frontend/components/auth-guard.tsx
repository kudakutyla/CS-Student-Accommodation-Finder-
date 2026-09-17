'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';

export function AuthGuard({
  children,
  allowedRoles = [],
  redirectTo = '/login',
}: {
  children: React.ReactNode;
  allowedRoles?: Array<'STUDENT' | 'LANDLORD' | 'ADMIN'>;
  redirectTo?: string;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      router.replace(redirectTo);
      return;
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      if (user.role === 'ADMIN') router.replace('/admin/dashboard');
      else if (user.role === 'LANDLORD') router.replace('/landlord/dashboard');
      else router.replace('/student/dashboard');
    }
  }, [isAuthenticated, isLoading, user, router, allowedRoles, redirectTo]);

  if (isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--text-muted)]">Loading your workspace...</div>;
  }

  if (!isAuthenticated || !user) return null;

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
