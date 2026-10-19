'use client';

import { Bell, Bookmark, Building2, ClipboardCheck, Flag, History, Home, LogOut, Menu, MessageCircle, Plus, Search, UserCircle, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import Navbar from './Navbar';
import { useAuth } from '../lib/auth-context';
import { ThemeToggle } from './theme-toggle';

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

  if (pathname === '/') {
    return <><Navbar /><main className="flex-1">{children}</main></>;
  }

  if (!role || !isAuthenticated || !user) {
    return <><Navbar /><main className="flex-1">{children}</main></>;
  }

  const details = roleDetails[role];
  const isAdmin = role === 'ADMIN';
  const usesStudentSidebarLayout = role === 'STUDENT' || role === 'LANDLORD';
  const usesLargeSidebarLayout = true;
  const roleLabel = role === 'ADMIN' ? 'Administrator' : role === 'LANDLORD' ? 'Landlord' : 'Student';

  async function signOut() {
    await logout();
    router.push('/');
  }

  function renderNavigationLink({ label, href, icon: Icon }: NavigationItem) {
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
        className={`inline-flex items-center gap-3 rounded-md px-3 py-2.5 ${usesLargeSidebarLayout ? 'text-lg' : 'text-base'} font-medium transition-colors ${active ? (isAdmin ? 'bg-white/10 text-white' : 'bg-[var(--accent-terracotta)] text-white') : (isAdmin ? 'text-white/70 hover:bg-white/10 hover:text-white' : 'text-[var(--text-muted)] hover:bg-[var(--cream)] hover:text-[var(--charcoal)]')}`}
      >
        <Icon size={usesLargeSidebarLayout ? 20 : 18} aria-hidden="true" />
        {label}
      </Link>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--cream)] md:flex">
      <aside className={`relative z-20 flex w-full flex-col border-b md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r ${isAdmin ? 'border-[#51443e] bg-[var(--charcoal)] text-[var(--warm-white)]' : 'border-[var(--beige)] bg-[var(--warm-white)] text-[var(--charcoal)]'}`}>
        <div className="flex items-center justify-between px-4 py-3 md:hidden">
          <div className="flex min-w-0 items-center gap-3">
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
            <Link href={details.links[0].href} className={`truncate font-serif font-semibold ${usesLargeSidebarLayout ? 'text-3xl' : 'text-2xl'}`}>Abode</Link>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle inverted={isAdmin} />
            <Link
              href={role === 'LANDLORD' ? '/landlord/profile' : role === 'STUDENT' ? '/student/profile' : '/admin/dashboard'}
              aria-label="Open profile"
              title="Open profile"
              className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border transition ${isAdmin ? 'border-white/20 text-white hover:bg-white/10' : 'border-[var(--beige)] text-[var(--charcoal)] hover:bg-[var(--cream)]'}`}
            >
              <UserCircle size={20} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {menuOpen ? <button type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-40 bg-black/40 md:hidden" /> : null}
        <div id="portal-navigation" className={`${menuOpen ? 'translate-x-0 visible' : '-translate-x-full invisible'} fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-y-auto border-r shadow-xl transition-transform duration-300 ease-out md:visible md:static md:z-auto md:h-auto md:min-h-0 md:w-auto md:flex-1 md:translate-x-0 md:border-r-0 md:shadow-none md:transition-none ${isAdmin ? 'border-[#51443e] bg-[var(--charcoal)] text-[var(--warm-white)]' : 'border-[var(--beige)] bg-[var(--warm-white)] text-[var(--charcoal)]'}`}>
          <div className="flex items-start justify-between border-b border-[var(--beige)] px-5 pb-2 pt-3 md:hidden">
            <div className="flex flex-col">
              <Link href={details.links[0].href} onClick={() => setMenuOpen(false)} className={`font-serif font-semibold ${usesLargeSidebarLayout ? 'text-4xl' : 'text-xl'}`}>Abode</Link>
              <div className={usesLargeSidebarLayout ? 'mt-1 flex flex-col gap-1' : ''}>
                <p className={`${usesLargeSidebarLayout ? 'max-w-48 truncate text-base font-semibold' : 'mt-0.5 max-w-48 truncate text-xs'} ${isAdmin ? 'text-white/90' : usesStudentSidebarLayout ? 'text-[var(--charcoal)]' : 'text-[var(--text-muted)]'}`}>{user.name}</p>
                <p className={`${usesLargeSidebarLayout ? 'text-base font-medium' : 'text-xs'} ${isAdmin ? 'text-white/70' : usesStudentSidebarLayout ? 'text-[var(--charcoal)]' : 'text-[var(--text-muted)]'}`}>{roleLabel}</p>
                {role === 'LANDLORD' && user.isVerified ? <span className="mt-2 w-fit rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">Verified provider</span> : null}
              </div>
            </div>
            <button type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)} className={`inline-flex h-10 w-10 items-center justify-center rounded-md ${isAdmin ? 'text-white hover:bg-white/10' : 'text-[var(--charcoal)] hover:bg-[var(--cream)]'}`}><X size={20} aria-hidden="true" /></button>
          </div>
          <nav aria-label={`${details.subtitle} navigation`} className="flex flex-1 flex-col">
            {usesLargeSidebarLayout ? (
              <div className={`hidden border-b px-3 md:block ${isAdmin ? 'border-[#51443e]' : 'border-[var(--beige)]'}`}>
                <div className="flex flex-col gap-2 px-3 pb-1 pt-6">
                  <Link href={details.links[0].href} className={`font-serif text-5xl font-semibold ${isAdmin ? 'text-[var(--warm-white)]' : 'text-[var(--charcoal)]'}`}>Abode</Link>
                  <div className="flex flex-col gap-2">
                    <p className={`truncate text-xl font-semibold leading-7 ${isAdmin ? 'text-[var(--warm-white)]' : 'text-[var(--charcoal)]'}`}>{user.name}</p>
                    <p className={`text-lg font-medium leading-6 ${isAdmin ? 'text-white/80' : 'text-[var(--charcoal)]'}`}>{roleLabel}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`flex flex-col gap-1 border-b px-3 pb-0 ${isAdmin ? 'border-[#51443e]' : 'border-[var(--beige)]'}`}>
                <div className="hidden px-3 pb-5 pt-6 md:block">
                  <Link href={details.links[0].href} className="font-serif text-2xl font-semibold">Abode</Link>
                  <p className={`mt-1 truncate text-xs ${isAdmin ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>{user.name}</p>
                  <p className={`text-xs ${isAdmin ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>{roleLabel}</p>
                </div>
                {details.links.slice(0, 2).map(renderNavigationLink)}
              </div>
            )}
            <div className={`flex flex-1 flex-col gap-1 px-3 pt-0 md:space-y-1 ${usesStudentSidebarLayout ? '' : 'md:pt-3'}`}>
              {details.links.map(renderNavigationLink)}
            </div>
          </nav>

          <div className={`w-full border-t px-3 py-2 md:px-4 ${isAdmin ? 'border-white/20' : 'border-[var(--beige)]'}`}>
            <button onClick={() => void signOut()} className={`inline-flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors ${isAdmin ? 'text-white/75 hover:bg-white/10 hover:text-white' : 'text-[var(--charcoal)] hover:bg-[var(--cream)]'}`}>
              <LogOut size={15} aria-hidden="true" />
              Sign out
            </button>
          </div>
          <div className="mt-auto border-t border-[var(--footer-border)] bg-[var(--footer-bg)] px-4 py-3 text-center text-[9px] leading-4 text-[var(--footer-muted)] sm:text-[10px]">
            <p>© {new Date().getFullYear()} Abode. All rights reserved.</p>
            <p className="mt-1">
              Geographic data ©{' '}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--footer-text)] underline underline-offset-2 hover:text-white"
              >
                OpenStreetMap contributors
              </a>
              {' · Routing by OSRM'}
            </p>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <header className="hidden h-14 items-center justify-end gap-2 border-b border-[var(--beige)] bg-[var(--warm-white)] px-4 sm:px-6 md:flex">
          <ThemeToggle />
          <Link
            href={role === 'LANDLORD' ? '/landlord/profile' : role === 'STUDENT' ? '/student/profile' : '/admin/dashboard'}
            aria-label="Open profile"
            title="Open profile"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--beige)] text-[var(--charcoal)] transition hover:bg-[var(--cream)]"
          >
            <UserCircle size={20} aria-hidden="true" />
          </Link>
        </header>
        {children}
      </main>
    </div>
  );
}