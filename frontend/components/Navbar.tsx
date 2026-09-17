'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    if (user.role === 'LANDLORD') return '/landlord/dashboard';
    return '/student/dashboard';
  };

  return (
    <header className="sticky top-0 z-40 bg-[var(--warm-white)] border-b border-[var(--beige)] backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-2xl font-bold text-[var(--charcoal)] tracking-tight">
              Abode
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--beige)] text-[var(--brown-dark)]">
              Student Accommodation
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--text-muted)]">
            <Link
              href="/"
              className={`hover:text-[var(--charcoal)] transition-colors ${
                pathname === '/' ? 'text-[var(--charcoal)] font-semibold' : ''
              }`}
            >
              Home
            </Link>
            <Link
              href="/listings"
              className={`hover:text-[var(--charcoal)] transition-colors ${
                pathname.startsWith('/listings') ? 'text-[var(--charcoal)] font-semibold' : ''
              }`}
            >
              Find Accommodation
            </Link>
          </nav>
        </div>

        {/* Auth CTA & Navigation */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <Link
                href={getDashboardLink()}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[var(--beige)] text-[var(--charcoal)] hover:bg-[var(--sand)] transition-all flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-[var(--accent-sage)]"></span>
                <span>Dashboard ({user.role})</span>
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--charcoal)] hover:bg-[var(--cream)] border border-[var(--beige)] transition-all"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--charcoal)] text-white hover:bg-[var(--charcoal-mid)] shadow-sm transition-all"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
