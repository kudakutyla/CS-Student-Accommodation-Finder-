'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { getMediaUrl } from '../lib/api';

export default function Navbar() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push('/');
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
            {!isLoading && !isAuthenticated ? <Link
              href="/"
              className={`hover:text-[var(--charcoal)] transition-colors ${
                pathname === '/' ? 'text-[var(--charcoal)] font-semibold' : ''
              }`}
            >
              Home
            </Link> : null}
            <Link
              href={isAuthenticated ? '/listings' : '/login?redirect=%2Flistings'}
              className={`hover:text-[var(--charcoal)] transition-colors ${
                pathname.startsWith('/listings') ? 'text-[var(--charcoal)] font-semibold' : ''
              }`}
            >
              {user?.role === 'LANDLORD' ? 'View Market' : 'Find Accommodation'}
            </Link>
          </nav>
        </div>

        {/* Auth CTA & Navigation */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              {user.role === 'STUDENT' ? <Link href="/student/favourites" className="hidden text-xs font-semibold text-[var(--charcoal)] hover:underline sm:inline">Saved homes</Link> : null}
              {user.role !== 'ADMIN' ? <Link href="/messages" className="hidden text-xs font-semibold text-[var(--charcoal)] hover:underline sm:inline">Messages</Link> : null}
              <Link href="/notifications" className="text-xs font-semibold text-[var(--charcoal)] hover:underline">Updates</Link>
              <Link href={user.role === 'LANDLORD' ? '/landlord/profile' : user.role === 'STUDENT' ? '/student/profile' : '/admin/dashboard'} className="rounded-xl bg-[var(--beige)] px-3.5 py-1.5 text-xs font-semibold text-[var(--charcoal)] transition-all hover:bg-[var(--sand)] flex items-center gap-2">
                {user.profilePicture ? <Image src={getMediaUrl(user.profilePicture)} alt={user.name} width={24} height={24} unoptimized className="h-6 w-6 rounded-full object-cover" /> : <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--warm-white)] text-[10px] font-bold">{user.name.slice(0, 1).toUpperCase()}</span>}
                <span>{user.name}</span>
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
