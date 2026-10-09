'use client';

import { Bell, Bookmark, Building2, ClipboardCheck, Flag, History, Home, LogOut, Menu, MessageCircle, Plus, Search, UserCircle, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import Navbar from './Navbar';
import { useAuth } from '../lib/auth-context';
import { getMediaUrl } from '../lib/api';

type UserRole = 'STUDENT' | 'LANDLORD' | 'ADMIN';
type NavigationItem = { label: string; href: string; icon: LucideIcon };

const roleDetails: Record<UserRole, { subtitle: string; links: NavigationItem[] }> = {
  STUDENT: {
    subtitle: 'Student portal',
    links: [
      { label: 'Dashboard', href: '/student/dashboard', icon: Home },
      { label: 'Find Homes', href: '/listings', icon: Search },
      { label: 'Saved Homes', href: '/student/favourites', icon: Bookmark },
      { label: 'My Reports', href: '/student/reports', icon: Flag },
      { label: 'Messages', href: '/messages', icon: MessageCircle },
      { label: 'Updates', href: '/notifications', icon: Bell },
      { label: 'Profile', href: '/student/profile', icon: UserCircle },
    ],
  },
  LANDLORD: {
    subtitle: 'Provider portal',
    links: [
      { label: 'Dashboard', href: '/landlord/dashboard', icon: Home },
      { label: 'My Properties', href: '/landlord/listings', icon: Building2 },
      { label: 'Add Property', href: '/landlord/listings/create', icon: Plus },
      { label: 'View Market', href: '/listings', icon: Search },
      { label: 'Messages', href: '/messages', icon: MessageCircle },
      { label: 'Portfolio/Profile', href: '/landlord/profile', icon: UserCircle },
    ],
  },
  ADMIN: {
    subtitle: 'Admin console',
    links: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: Home },
      { label: 'Campuses', href: '/admin/campuses', icon: Building2 },
      { label: 'Pending listings', href: '/admin/pending-listings', icon: ClipboardCheck },
      { label: 'Reports', href: '/admin/reports', icon: Flag },
      { label: 'Audit history', href: '/admin/audit-history', icon: History },
      { label: 'Updates', href: '/notifications', icon: Bell },
    ],
  },
};

function getRouteRole(pathname: string, signedInRole?: UserRole): UserRole | null {
  if (pathname.startsWith('/student')) return 'STUDENT';
  if (pathname.startsWith('/landlord')) return 'LANDLORD';
  if (pathname.startsWith('/admin')) return 'ADMIN';
  if (
    (pathname.startsWith('/listings') ||
      pathname.startsWith('/messages') ||
      pathname.startsWith('/notifications')) &&
    signedInRole
  ) {
    return signedInRole;
  }
  return signedInRole ?? null;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const role = getRouteRole(pathname, user?.role);

  if (isLoading || (pathname.startsWith('/listings') && (!isAuthenticated || !user))) {
    return <main className="flex-1">{children}</main>;
  }

  if (!role || !isAuthenticated || !user) {
    return <><Navbar /><main className="flex-1">{children}</main></>;
  }

  const details = roleDetails[role];
  const isAdmin = role === 'ADMIN';

  async function signOut() {
    await logout();
    router.push('/');
  }

  return (
    <div className="min-h-screen bg-[var(--cream)] md:flex">
      <aside className={`relative z-20 flex w-full flex-col border-b md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r ${isAdmin ? 'border-[#51443e] bg-[var(--charcoal)] text-[var(--warm-white)]' : 'border-[var(--beige)] bg-[var(--warm-white)] text-[var(--charcoal)]'}`}>
        <div className="flex items-center justify-between px-4 py-3 md:block md:px-6 md:py-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={menuOpen}
              aria-controls="portal-navigation"
              onClick={() => setMenuOpen((open) => !open)}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-md md:hidden ${isAdmin ? 'text-white hover:bg-white/10' : 'text-[var(--charcoal)] hover:bg-[var(--cream)]'}`}
            >
              {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>
            <div>
              <Link href={details.links[0].href} className="font-serif text-2xl font-semibold">Abode</Link>
              <p className={`mt-0.5 text-xs ${isAdmin ? 'text-white/60' : 'text-[var(--text-muted)]'}`}>{details.subtitle}</p>
            </div>
          </div>
          {role === 'LANDLORD' && user.isVerified ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">Verified provider</span> : null}
        </div>

        {menuOpen ? <button type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-40 bg-black/40 md:hidden" /> : null}
        <div id="portal-navigation" className={`${menuOpen ? 'translate-x-0 visible' : '-translate-x-full invisible'} fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r shadow-xl transition-transform duration-300 ease-out md:visible md:static md:z-auto md:h-auto md:w-auto md:translate-x-0 md:border-r-0 md:shadow-none md:transition-none ${isAdmin ? 'border-[#51443e] bg-[var(--charcoal)] text-[var(--warm-white)]' : 'border-[var(--beige)] bg-[var(--warm-white)] text-[var(--charcoal)]'}`}>
          <div className="flex items-center justify-between border-b border-[var(--beige)] px-5 py-4 md:hidden">
            <div>
              <Link href={details.links[0].href} onClick={() => setMenuOpen(false)} className="font-serif text-xl font-semibold">Abode</Link>
              <p className={`mt-0.5 text-xs ${isAdmin ? 'text-white/60' : 'text-[var(--text-muted)]'}`}>{details.subtitle}</p>
            </div>
            <button type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)} className={`inline-flex h-10 w-10 items-center justify-center rounded-md ${isAdmin ? 'text-white hover:bg-white/10' : 'text-[var(--charcoal)] hover:bg-[var(--cream)]'}`}><X size={20} aria-hidden="true" /></button>
          </div>
          <nav aria-label={`${details.subtitle} navigation`} className="flex flex-col gap-1 px-3 pb-3 md:space-y-1 md:px-3">
            {details.links.map(({ label, href, icon: Icon }) => {
              const targetPath = href.split('#')[0];
              const active =
                (pathname === targetPath ||
                  (targetPath === '/listings' && pathname.startsWith('/listings/'))) &&
                !href.includes('#');
              return (
                <Link
                  key={label}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={`inline-flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${active ? (isAdmin ? 'bg-white/10 text-white' : 'bg-[var(--accent-terracotta)] text-white') : (isAdmin ? 'text-white/70 hover:bg-white/10 hover:text-white' : 'text-[var(--text-muted)] hover:bg-[var(--cream)] hover:text-[var(--charcoal)]')}`}
                >
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className={`flex items-center justify-between gap-3 border-t px-4 py-3 md:mt-auto md:px-5 ${isAdmin ? 'border-[#51443e]' : 'border-[var(--beige)]'}`}>
            <div className="flex min-w-0 items-center gap-3">
            {user.profilePicture ? (
              <Image src={getMediaUrl(user.profilePicture)} alt={user.name} width={36} height={36} unoptimized className="h-9 w-9 rounded-full object-cover ring-2 ring-white/60" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--beige)] text-xs font-bold text-[var(--charcoal)]">
                {user.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className={`text-xs ${isAdmin ? 'text-white/60' : 'text-[var(--text-muted)]'}`}>{role === 'ADMIN' ? 'Administrator' : role === 'LANDLORD' ? 'Landlord' : 'Student'}</p>
            </div>
          </div>
            <button onClick={() => void signOut()} className={`inline-flex shrink-0 items-center gap-2 rounded-md px-2.5 py-2 text-xs font-semibold ${isAdmin ? 'text-white/70 hover:bg-white/10 hover:text-white' : 'text-[var(--text-muted)] hover:bg-red-50 hover:text-[var(--danger)]'}`}>
              <LogOut size={15} aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}