import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "maplibre-gl/dist/maplibre-gl.css";
import { AuthProvider } from "../lib/auth-context";
import AppShell from "../components/app-shell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Abode | Student Accommodation Finder",
  description: "Find and compare student accommodation near campus.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--cream)] text-[var(--charcoal)]">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
        <footer className="border-t border-[var(--footer-border)] bg-[var(--footer-bg)] px-4 py-8 text-sm text-[var(--footer-text)] sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1">
              <Link href="/" className="font-serif text-xl font-semibold text-[var(--footer-text)]">Abode</Link>
              <p className="mt-2 max-w-xs text-xs leading-5 text-[var(--footer-muted)]">Find administrator-approved student accommodation near campus and connect with property providers.</p>
            </div>
            <nav aria-label="About Abode">
              <h2 className="font-semibold text-[var(--warm-white)]">About</h2>
              <ul className="mt-3 space-y-2 text-xs text-[var(--footer-muted)]">
                <li><Link href="/about" className="underline-offset-4 hover:text-[var(--footer-text)] hover:underline">About Abode</Link></li>
                <li><Link href="/safety" className="underline-offset-4 hover:text-[var(--footer-text)] hover:underline">Safety &amp; reporting</Link></li>
              </ul>
            </nav>
            <nav aria-label="Help and contact">
              <h2 className="font-semibold text-[var(--warm-white)]">Help</h2>
              <ul className="mt-3 space-y-2 text-xs text-[var(--footer-muted)]">
                <li><a href="mailto:luluchif97@gmail.com" className="break-all underline-offset-4 hover:text-[var(--footer-text)] hover:underline">luluchif97@gmail.com</a></li>
                <li><Link href="/listings" className="underline-offset-4 hover:text-[var(--footer-text)] hover:underline">Browse accommodation</Link></li>
                <li><Link href="/share" className="underline-offset-4 hover:text-[var(--footer-text)] hover:underline">Share Abode</Link></li>
              </ul>
            </nav>
            <nav aria-label="Legal information">
              <h2 className="font-semibold text-[var(--warm-white)]">Policies</h2>
              <ul className="mt-3 space-y-2 text-xs text-[var(--footer-muted)]">
                <li><Link href="/privacy" className="underline-offset-4 hover:text-[var(--footer-text)] hover:underline">Privacy notice (draft)</Link></li>
                <li><Link href="/terms" className="underline-offset-4 hover:text-[var(--footer-text)] hover:underline">Terms of use (draft)</Link></li>
              </ul>
            </nav>
          </div>
          <div className="mx-auto mt-8 flex max-w-7xl flex-col gap-2 border-t border-[var(--footer-border)] pt-4 text-center text-xs text-[var(--footer-muted)] sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <p>© {new Date().getFullYear()} Abode. All rights reserved.</p>
            <p>
              Geographic data ©{' '}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--footer-text)] underline underline-offset-4 hover:text-white"
              >
                OpenStreetMap contributors
              </a>
              {' · Routing by OSRM'}
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
